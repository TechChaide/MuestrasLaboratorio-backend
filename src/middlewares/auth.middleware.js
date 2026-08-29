const jwt = require('jsonwebtoken');
const SECRET_KEY = process.env.SECRET_KEY || 'AyH~@UY<8.z!4+K?M^SHZ}OAW^qsr-s#';

const verifyToken = (req, res, next) => {
    const token = req.headers['authorization'];

    if (!token) {
        return res.status(403).json({ 
            message: 'Authentication token required',
            code: 'MISSING_TOKEN'
        });
    }

    try {
        const decoded = jwt.verify(
            token.replace('Bearer ', ''), 
            SECRET_KEY
        );
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ 
            message: 'Invalid or expired token',
            code: 'INVALID_TOKEN',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

module.exports = { verifyToken };