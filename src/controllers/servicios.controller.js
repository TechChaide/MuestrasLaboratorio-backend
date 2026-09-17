const db = require("../models");
const { QueryTypes } = require("sequelize");

// Base de datos de maestros de materiales. Puede vivir en una BD distinta
// a la principal de este proyecto dentro del mismo servidor SQL Server,
// por eso se referencia explícitamente en el EXEC ([BD].[dbo].[sp]).
const DB_NAME_MATERIALES = process.env.DB_NAME_MATERIALES || process.env.DB_NAME;

// Caché simple en memoria (TTL 60s) para no golpear el SP en cada tecla.
const CACHE_TTL_MS = 60 * 1000;
const materialesCache = new Map(); // busqueda normalizada -> { data, expiresAt }

function getCached(key) {
    const hit = materialesCache.get(key);
    if (hit && hit.expiresAt > Date.now()) return hit.data;
    materialesCache.delete(key);
    return null;
}

function setCached(key, data) {
    materialesCache.set(key, { data, expiresAt: Date.now() + CACHE_TTL_MS });
}

module.exports = {

    // ============================================================
    // Búsqueda as-you-type de materiales (maestro de materiales).
    // Ruta: GET /api/servicios/materiales/buscar?Busqueda=texto
    // Replicado y simplificado desde Muestreo-DDPP/muestreos-backend.
    // ============================================================
    buscarMaterialesAsYouType: async (req, res) => {
        const Busqueda = (req.query.Busqueda ?? req.query.q ?? "").toString().trim();

        if (Busqueda.length < 2) {
            return res.status(200).json({ data: [], length: 0, cached: false });
        }

        const busquedaNorm = Busqueda.toUpperCase();

        try {
            const cached = getCached(busquedaNorm);
            if (cached) {
                res.set("X-Cache", "HIT");
                return res.status(200).json({ data: cached, length: cached.length, cached: true });
            }

            const resultado = await db.sequelize.query(
                `EXEC [${DB_NAME_MATERIALES}].[dbo].[sp_get_MaterialesByCriterio] :Busqueda`,
                {
                    type: QueryTypes.SELECT,
                    replacements: { Busqueda: busquedaNorm },
                }
            );

            setCached(busquedaNorm, resultado);

            res.set("X-Cache", "MISS");
            res.status(200).json({ data: resultado, length: resultado.length, cached: false });
        } catch (error) {
            console.error("Error al buscar materiales:", error);
            res.status(500).json({ msg: "Error en el servidor al buscar materiales." });
        }
    },
};
