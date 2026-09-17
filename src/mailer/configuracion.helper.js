const axios = require('axios');

// Mismo endpoint que ya consume el frontend (src/services/seguridades/configuracion.service.ts)
// para leer la tabla `configuracion` de seguridadesGuard — se replica acá porque el
// disparo de la notificación 2.1 (requerimiento entrante) vive en este backend Express,
// no en el frontend.
const SEGURIDADES_GUARD_URL = process.env.SEGURIDADES_GUARD_URL || 'https://apps.chaide.com/seguridadesGuard';
const CODIGO_APLICACION = 'APP_ENSAYOS_LABORATORIO';

/** Valor crudo (string) de una configuración puntual por nombre, o '' si no existe
 * o si seguridadesGuard no responde (el llamador decide qué hacer con un correo vacío). */
async function getValorConfiguracion(nombreConfiguracion, codigoAplicacion = CODIGO_APLICACION) {
    try {
        const { data } = await axios.post(`${SEGURIDADES_GUARD_URL}/api/configuracion/by-codigo-aplicacion`, {
            codigo_aplicacion: codigoAplicacion,
        });
        const items = Array.isArray(data?.data) ? data.data : [];
        const config = items.find((c) => c.nombre_configuracion === nombreConfiguracion);
        return config?.valor_configuracion || '';
    } catch (err) {
        console.error(`No se pudo resolver la configuración "${nombreConfiguracion}" (${codigoAplicacion}):`, err.message);
        return '';
    }
}

module.exports = { getValorConfiguracion };
