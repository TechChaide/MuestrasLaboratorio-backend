const axios = require('axios');

// Mismo servicio que ya consume el frontend (src/services/seguridades/servicios.service.ts
// getUsersInfo -> GET /api/usuarios/fichasUsuarios, sobre environment.apiSeguridadesINIT)
// para resolver código de empleado -> nombre. Se replica acá porque los correos de
// notificación (mailer.js) los dispara este backend Express, no el frontend, y no tiene
// acceso al localStorage donde el frontend cachea la ficha.
//
// OJO: es un servicio DISTINTO de seguridadesGuard (configuracion.helper.js) — "seguridades"
// (fichas de empleados) vs "seguridadesGuard" (auth/configuración). No comparten base URL
// aunque el nombre se parezca.
const SEGURIDADES_URL = process.env.SEGURIDADES_URL || 'https://apps.chaide.com/seguridades';

// Cache corta en memoria: evita golpear el servicio en cada correo cuando se
// aprueban/rechazan varios ensayos seguidos (p.ej. revisión en lote de una solicitud).
let cache = { fichas: null, expiresAt: 0 };
const CACHE_TTL_MS = 5 * 60 * 1000;

async function getFichasUsuarios() {
    const now = Date.now();
    if (cache.fichas && cache.expiresAt > now) return cache.fichas;
    try {
        const { data } = await axios.get(`${SEGURIDADES_URL}/api/usuarios/fichasUsuarios`);
        const fichas = Array.isArray(data?.data) ? data.data : [];
        cache = { fichas, expiresAt: now + CACHE_TTL_MS };
        return fichas;
    } catch (err) {
        console.error('No se pudo obtener la ficha de usuarios de seguridades:', err.message);
        return cache.fichas || [];
    }
}

/** Resuelve un código de empleado a su nombre completo. Si no se encuentra o
 * el servicio no responde, devuelve el propio código como respaldo — mejor
 * mostrar algo reconocible en el correo que dejar el campo vacío. */
async function getNombreEmpleado(codigo) {
    if (!codigo) return '';
    const fichas = await getFichasUsuarios();
    const ficha = fichas.find((f) => String(f.CODIGO).trim() === String(codigo).trim());
    return ficha?.NOMBRE || String(codigo);
}

module.exports = { getNombreEmpleado, getFichasUsuarios };
