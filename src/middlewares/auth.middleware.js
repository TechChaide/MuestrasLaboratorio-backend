const axios = require('axios');

/**
 * Validación de token vía seguridadesGuard — mismo patrón que muestreos-backend.
 * GET AUTH_API_URL con Authorization: Bearer <token>
 * Respuesta esperada: true
 */
const AUTH_API_URL =
    process.env.AUTH_API_URL ||
    'http://seguridades_guard_service:5400/api/auths/checkToken';

const AUTH_DISABLED =
    process.env.NODE_ENV !== 'production' &&
    String(process.env.DISABLE_AUTH || process.env.SKIP_AUTH || '')
        .toLowerCase() === 'true';

if (AUTH_DISABLED) {
    console.warn('\n========================================================');
    console.warn('⚠️  AUTH DESHABILITADA (DISABLE_AUTH/SKIP_AUTH=true)');
    console.warn('⚠️  TODOS LOS ENDPOINTS ESTÁN SIN VERIFICACIÓN DE TOKEN');
    console.warn('⚠️  NO USAR EN PRODUCCIÓN');
    console.warn('========================================================\n');
}

const verifyToken = async (req, res, next) => {
    if (AUTH_DISABLED) {
        req.token = 'DISABLED';
        return next();
    }

    let token = null;
    const authHeader = req.headers['authorization'];
    const cookieToken = req.cookies?.token;

    console.log('authHeader:', authHeader);
    console.log('cookieToken:', cookieToken);

    if (authHeader) token = authHeader.replace(/^Bearer\s+/i, '').trim();
    if (!token && cookieToken) token = cookieToken;

    if (!token) {
        return res.status(403).json({
            message: 'Authentication token required',
            code: 'MISSING_TOKEN',
        });
    }

    try {
        const response = await axios.get(AUTH_API_URL, {
            headers: { Authorization: `Bearer ${token}` },
            timeout: 15000,
        });

        if (response.data === true) {
            req.token = token;
            return next();
        }

        return res.status(401).json({
            message: 'Invalid or expired token',
            code: 'INVALID_TOKEN',
        });
    } catch (error) {
        console.error('Token validation error:', error.message);
        return res.status(401).json({
            message: 'Token validation failed',
            code: 'VALIDATION_ERROR',
            details:
                process.env.NODE_ENV === 'development' ? error.message : undefined,
        });
    }
};

module.exports = { verifyToken };
