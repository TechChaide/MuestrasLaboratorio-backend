/**
 * Quita el dígito extra pegado a Resultado.valor (casi siempre el N° de muestras
 * de la tabla: 5 muestras → 5+"298.47"="5298.47", o insertado: 301.99 → 3051.99).
 *
 * Ensayo 280 (Densidad ISO 845) se corrige con los valores de la pantalla.
 *
 *   node scripts/corregir-valor-digito.js
 *   node scripts/corregir-valor-digito.js --apply
 */
require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });
const sequelize = require("../src/config/database");

const APPLY = process.argv.includes("--apply");
const MUESTRA_RE = /^\(?(\d+)\)?$/;

/** Pantalla Densidad NTE INEN ISO 845, ensayo 280. */
const FIX_280 = [
  [14871, 301.99],
  [14872, 396],
  [14873, 388],
  [14874, 49.6],
  [14875, 39.6263],
  [14876, 39.9],
  [14877, 298.47],
  [14878, 380],
  [14879, 393],
  [14880, 50.4],
  [14881, 39.6546],
  [14882, 300.88],
  [14883, 387],
  [14884, 394],
  [14885, 49.6],
  [14886, 39.7836],
  [14887, 300.7],
  [14888, 392],
  [14889, 382],
  [14890, 50],
  [14891, 40.1619],
  [14892, 304.93],
  [14894, 392],
  [14893, 383],
  [14895, 50.6],
  [14896, 40.1388],
];

function parseNum(v) {
  if (v == null || v === "") return null;
  const n = Number(String(v).trim().replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

function round4(n) {
  return Math.round(n * 10000) / 10000;
}

/** Candidatos al quitar el dígito D solo de la parte entera. */
function candidatosSinDigito(valor, D) {
  const original = parseNum(valor);
  if (original == null || D == null) return [];
  const s = String(valor).trim();
  const dot = s.indexOf(".");
  const intPart = dot < 0 ? s.replace("-", "") : s.slice(s.startsWith("-") ? 1 : 0, dot);
  const decPart = dot < 0 ? null : s.slice(dot + 1);
  const sign = s.startsWith("-") ? "-" : "";
  const d = String(D);
  const out = [];
  const seen = new Set();
  const push = (candStr) => {
    const n = parseNum(candStr);
    if (n == null || n === original) return;
    if (seen.has(n)) return;
    seen.add(n);
    out.push(n);
  };

  if (intPart.startsWith(d) && intPart.length > d.length) {
    push(sign + intPart.slice(d.length) + (decPart != null ? `.${decPart}` : ""));
  }
  for (let i = 0; i < intPart.length; i++) {
    if (intPart[i] !== d) continue;
    const candInt = intPart.slice(0, i) + intPart.slice(i + 1);
    if (!candInt || candInt === "-") continue;
    push(sign + candInt + (decPart != null ? `.${decPart}` : ""));
  }
  return out;
}

function mediana(nums) {
  const s = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 === 0 ? (s[mid - 1] + s[mid]) / 2 : s[mid];
}

/**
 * El extra es un dígito de más: el original queda ~10× (o 100×) del candidato,
 * o es D pegado al frente (5298.47 vs 298.47).
 */
function elegirCandidato(original, cands, pares) {
  const peers = pares.filter((v) => v != null && Math.abs(v - original) > 1e-6);
  const med = peers.length ? mediana(peers) : null;

  let best = null;
  let bestScore = Infinity;
  for (const c of cands) {
    if (c <= 0) continue;
    if (c < 0.5 && original >= 10) continue;
    const ratio = original / c;
    const extraMagnitud = ratio > 8 && ratio < 120;
    const insertado = ratio > 8 && ratio < 14;
    if (!extraMagnitud && !insertado) continue;

    let score;
    if (med != null && Math.abs(med) > 1e-9) {
      score = Math.abs(c - med) / Math.max(Math.abs(med), 1);
      const scoreOrig = Math.abs(original - med) / Math.max(Math.abs(med), 1);
      if (score >= scoreOrig) continue;
      if (score > 0.5) continue;
    } else {
      score = extraMagnitud ? 0.2 : 0.4;
    }
    if (score < bestScore) {
      bestScore = score;
      best = c;
    }
  }
  return best;
}

async function main() {
  await sequelize.authenticate();

  const [celdas] = await sequelize.query(`
    SELECT codigo_celda, codigo_tabla, fila, col, alias, tipo_celda
    FROM dbo.celda
  `);
  const porTabla = new Map();
  const porId = new Map();
  for (const c of celdas) {
    porId.set(c.codigo_celda, c);
    if (!porTabla.has(c.codigo_tabla)) porTabla.set(c.codigo_tabla, []);
    porTabla.get(c.codigo_tabla).push(c);
  }

  const nMuestrasPorTabla = new Map();
  for (const [tabla, lista] of porTabla) {
    let max = 1;
    for (const c of lista) {
      if (Number(c.col) !== 1) continue;
      const m = MUESTRA_RE.exec((c.alias || "").trim());
      if (!m) continue;
      const n = Number(m[1]);
      if (Number.isInteger(n) && n > max) max = n;
    }
    nMuestrasPorTabla.set(tabla, max);
  }

  const [rows] = await sequelize.query(`
    SELECT
      r.codigo_resultado,
      r.codigo_ensayo_categoria_ensayo,
      r.codigo_celda,
      r.valor,
      s.identificador_ensayo
    FROM dbo.resultado r
    JOIN dbo.ensayo_categoria_ensayo e
      ON e.codigo_ensayo_categoria_ensayo = r.codigo_ensayo_categoria_ensayo
    LEFT JOIN dbo.solicitud s ON s.codigo_solicitud = e.codigo_solicitud
    WHERE r.estado = 'A' AND r.valor IS NOT NULL
  `);

  const fijos = new Map(FIX_280);
  const cambios = [];

  for (const r of rows) {
    const fijo = fijos.get(r.codigo_resultado);
    if (fijo != null) {
      const original = parseNum(r.valor);
      if (original != null && Math.abs(original - fijo) > 1e-6) {
        cambios.push({
          codigo_resultado: r.codigo_resultado,
          identificador: r.identificador_ensayo || `#${r.codigo_ensayo_categoria_ensayo}`,
          codigo_ensayo: r.codigo_ensayo_categoria_ensayo,
          valor_actual: original,
          valor_nuevo: fijo,
          origen: "pantalla-280",
        });
      }
    }
  }

  const grupos = new Map();
  for (const r of rows) {
    if (fijos.has(r.codigo_resultado)) continue;
    const cel = porId.get(r.codigo_celda);
    const key = `${r.codigo_ensayo_categoria_ensayo}|${cel?.codigo_tabla || 0}|${cel?.col || 0}`;
    if (!grupos.has(key)) grupos.set(key, []);
    grupos.get(key).push(r);
  }

  for (const grupo of grupos.values()) {
    const valoresCol = grupo.map((r) => parseNum(r.valor)).filter((v) => v != null);
    for (const r of grupo) {
      const cel = porId.get(r.codigo_celda);
      const D = nMuestrasPorTabla.get(cel?.codigo_tabla) || 1;
      const original = parseNum(r.valor);
      if (original == null) continue;
      const cands = candidatosSinDigito(r.valor, D);
      if (D !== 1) {
        for (const extra of candidatosSinDigito(r.valor, 1)) {
          if (!cands.includes(extra)) cands.push(extra);
        }
      }
      const elegido = elegirCandidato(original, cands, valoresCol);
      if (elegido == null) continue;
      cambios.push({
        codigo_resultado: r.codigo_resultado,
        identificador: r.identificador_ensayo || `#${r.codigo_ensayo_categoria_ensayo}`,
        codigo_ensayo: r.codigo_ensayo_categoria_ensayo,
        valor_actual: original,
        valor_nuevo: round4(elegido),
        origen: `digito-${D}`,
      });
    }
  }

  const de280 = cambios.filter((c) => c.codigo_ensayo === 280);
  console.log(APPLY ? "MODO APLICAR" : "MODO SIMULACIÓN (pasa --apply para escribir)");
  console.log("cambios totales:", cambios.length);
  console.log("ensayo 280 (pantalla):", de280.length);
  console.log("resto (dígito extra):", cambios.length - de280.length);

  console.log("\nEnsayo 280:");
  for (const c of de280.sort((a, b) => a.codigo_resultado - b.codigo_resultado)) {
    console.log(
      `  codigo_resultado=${c.codigo_resultado}  ${c.valor_actual} → ${c.valor_nuevo}`
    );
  }

  const otros = cambios.filter((c) => c.codigo_ensayo !== 280).slice(0, 40);
  if (otros.length) {
    console.log("\nOtros ejemplos:");
    for (const c of otros) {
      console.log(
        `  ${c.identificador}  id=${c.codigo_resultado}  ${c.valor_actual} → ${c.valor_nuevo}  (${c.origen})`
      );
    }
  }

  if (!APPLY) {
    console.log("\nNada escrito. Revisa y corre con --apply.");
    return;
  }

  const t = await sequelize.transaction();
  try {
    const chunk = 200;
    for (let i = 0; i < cambios.length; i += chunk) {
      const slice = cambios.slice(i, i + chunk);
      const ids = slice.map((c) => c.codigo_resultado);
      const valorCase = slice
        .map((c) => `WHEN ${c.codigo_resultado} THEN ${c.valor_nuevo}`)
        .join(" ");
      await sequelize.query(
        `UPDATE dbo.resultado
         SET valor = CASE codigo_resultado ${valorCase} ELSE valor END
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
