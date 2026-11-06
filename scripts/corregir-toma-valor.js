/**
 * Corrige Resultado.toma y Resultado.valor en TODAS las solicitudes.
 *
 * toma: número de muestra de la columna 1 de la fila, alias "(1)", "(2)", …
 * valor: si el número de muestra quedó pegado al inicio (1+"25.4"="125.4"), se quita.
 *        Solo se parte el valor cuando, en la misma columna del mismo ensayo,
 *        el candidato encaja mejor con las demás mediciones.
 *
 * Uso:
 *   node scripts/corregir-toma-valor.js           # simulación
 *   node scripts/corregir-toma-valor.js --apply   # escribe en BD
 */
require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });
const sequelize = require("../src/config/database");

const APPLY = process.argv.includes("--apply");
const MUESTRA_RE = /^\(?(\d+)\)?$/;

function parseNum(v) {
  if (v == null || v === "") return null;
  const n = Number(String(v).trim().replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

function tomaDesdeCeldas(celda, celdasDeTabla) {
  const fila = Number(celda.fila) || 1;
  for (let f = fila; f >= 1; f--) {
    const marker = celdasDeTabla.find((c) => c.fila === f && c.col === 1);
    const m = MUESTRA_RE.exec((marker?.alias || "").trim());
    if (m) {
      const n = Number(m[1]);
      if (Number.isInteger(n) && n > 0) return n;
    }
  }
  return 1;
}

function candidatoSinPrefijo(valor, toma) {
  const original = parseNum(valor);
  if (original == null || toma == null) return null;
  const s = String(valor).trim();
  const prefix = String(toma);
  if (!s.startsWith(prefix)) return null;
  const rest = s.slice(prefix.length);
  if (rest === "" || rest === "." || rest === "-") return null;
  const n = parseNum(rest);
  if (n == null) return null;
  if (n === original) return null;
  return n;
}

function mediana(nums) {
  const s = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 === 0 ? (s[mid - 1] + s[mid]) / 2 : s[mid];
}

function debePartir(original, candidato, pares, toma) {
  if (toma <= 1 && (original < 100 || candidato < 10)) return false;
  if (toma >= 2 && original < toma * 10) return false;
  if (candidato < 0.5 && original >= 10) return false;
  const peers = pares.filter((v) => v != null && Math.abs(v - original) > 1e-9);
  if (peers.length === 0) {
    const os = String(original);
    const cs = String(candidato);
    return os.includes(".") && cs.includes(".") && os.length > cs.length;
  }
  const med = mediana(peers);
  const escala = Math.max(Math.abs(med), 1e-9);
  const relOrig = Math.abs(original - med) / escala;
  const relCand = Math.abs(candidato - med) / escala;
  return relCand < relOrig && relCand < 0.35;
}

async function main() {
  await sequelize.authenticate();

  const [celdas] = await sequelize.query(`
    SELECT codigo_celda, codigo_tabla, fila, col, alias
    FROM dbo.celda
  `);
  const porTabla = new Map();
  const porId = new Map();
  for (const c of celdas) {
    porId.set(c.codigo_celda, c);
    if (!porTabla.has(c.codigo_tabla)) porTabla.set(c.codigo_tabla, []);
    porTabla.get(c.codigo_tabla).push(c);
  }
  for (const lista of porTabla.values()) {
    lista.sort((a, b) => a.fila - b.fila || a.col - b.col);
  }

  const tomaPorCelda = new Map();
  for (const c of celdas) {
    tomaPorCelda.set(c.codigo_celda, tomaDesdeCeldas(c, porTabla.get(c.codigo_tabla) || []));
  }

  const [rows] = await sequelize.query(`
    SELECT
      r.codigo_resultado,
      r.codigo_ensayo_categoria_ensayo,
      r.codigo_celda,
      r.toma AS toma_actual,
      r.valor,
      s.identificador_ensayo
    FROM dbo.resultado r
    JOIN dbo.ensayo_categoria_ensayo e
      ON e.codigo_ensayo_categoria_ensayo = r.codigo_ensayo_categoria_ensayo
    LEFT JOIN dbo.solicitud s ON s.codigo_solicitud = e.codigo_solicitud
    WHERE r.estado = 'A'
  `);

  const grupos = new Map();
  for (const r of rows) {
    const cel = porId.get(r.codigo_celda);
    const key = `${r.codigo_ensayo_categoria_ensayo}|${cel?.codigo_tabla || 0}|${cel?.col || 0}`;
    if (!grupos.has(key)) grupos.set(key, []);
    grupos.get(key).push(r);
  }

  const cambios = [];
  for (const grupo of grupos.values()) {
    const valoresCol = grupo.map((r) => parseNum(r.valor)).filter((v) => v != null);
    for (const r of grupo) {
      const tomaNueva = tomaPorCelda.get(r.codigo_celda) || 1;
      const original = parseNum(r.valor);
      const cand = original == null ? null : candidatoSinPrefijo(r.valor, tomaNueva);
      const partir =
        cand != null && original != null && debePartir(original, cand, valoresCol, tomaNueva);
      const valorNuevo = partir ? Math.round(cand * 100) / 100 : original;
      const tomaCambia = Number(r.toma_actual) !== tomaNueva;
      const valorCambia = original != null && valorNuevo != null && original !== valorNuevo;
      if (!tomaCambia && !valorCambia) continue;
      cambios.push({
        codigo_resultado: r.codigo_resultado,
        identificador: r.identificador_ensayo || `#${r.codigo_ensayo_categoria_ensayo}`,
        codigo_ensayo: r.codigo_ensayo_categoria_ensayo,
        toma_actual: r.toma_actual,
        toma_nueva: tomaNueva,
        valor_actual: original,
        valor_nuevo: valorCambia ? valorNuevo : original,
        valor_cambia: valorCambia,
      });
    }
  }

  const porSolicitud = new Map();
  for (const c of cambios) {
    if (!porSolicitud.has(c.identificador)) {
      porSolicitud.set(c.identificador, { toma: 0, valor: 0, ensayos: new Set() });
    }
    const agg = porSolicitud.get(c.identificador);
    agg.ensayos.add(c.codigo_ensayo);
    if (c.toma_actual !== c.toma_nueva) agg.toma += 1;
    if (c.valor_cambia) agg.valor += 1;
  }

  console.log(APPLY ? "MODO APLICAR" : "MODO SIMULACIÓN (pasa --apply para escribir)");
  console.log("solicitudes afectadas:", porSolicitud.size);
  console.log("filas resultado a actualizar:", cambios.length);
  console.log(
    "cambios de toma:",
    cambios.filter((c) => c.toma_actual !== c.toma_nueva).length
  );
  console.log("valores partidos:", cambios.filter((c) => c.valor_cambia).length);
  console.log("\nPor solicitud:");
  for (const [id, agg] of [...porSolicitud.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    console.log(
      `  ${id}  ensayos=${agg.ensayos.size}  toma=${agg.toma}  valor=${agg.valor}`
    );
  }

  const ejemplosValor = cambios.filter((c) => c.valor_cambia).slice(0, 30);
  if (ejemplosValor.length) {
    console.log("\nEjemplos de valor partido:");
    for (const e of ejemplosValor) {
      console.log(
        `  ${e.identificador}  toma ${e.toma_actual}→${e.toma_nueva}  valor ${e.valor_actual}→${e.valor_nuevo}`
      );
    }
  }

  if (!APPLY) {
    console.log("\nNada escrito. Revisa el resumen y corre con --apply.");
    return;
  }

  const t = await sequelize.transaction();
  try {
    const chunk = 200;
    for (let i = 0; i < cambios.length; i += chunk) {
      const slice = cambios.slice(i, i + chunk);
      const ids = slice.map((c) => c.codigo_resultado);
      const tomaCase = slice
        .map((c) => `WHEN ${c.codigo_resultado} THEN ${c.toma_nueva}`)
        .join(" ");
      const valorCase = slice
        .map((c) => {
          const v = c.valor_cambia ? c.valor_nuevo : c.valor_actual;
          if (v == null) return `WHEN ${c.codigo_resultado} THEN valor`;
          return `WHEN ${c.codigo_resultado} THEN ${v}`;
        })
        .join(" ");
      await sequelize.query(
        `UPDATE dbo.resultado
         SET toma = CASE codigo_resultado ${tomaCase} ELSE toma END,
             valor = CASE codigo_resultado ${valorCase} ELSE valor END
         WHERE codigo_resultado IN (${ids.join(",")})`,
        { transaction: t }
      );
      console.log(`  ${Math.min(i + chunk, cambios.length)}/${cambios.length}`);
    }
    await t.commit();
    console.log("\nActualizado:", cambios.length, "filas.");
  } catch (err) {
    await t.rollback();
    throw err;
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => sequelize.close());
