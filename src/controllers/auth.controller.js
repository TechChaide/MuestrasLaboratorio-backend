const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Usuario } = require('../models');
const { handleError } = require('../helpers/error.helper');

const SECRET_KEY = process.env.SECRET_KEY || 'J*lL5yfvsDyE0p2?i$}}HUkjB<H!F=&A';
const TOKEN_EXPIRES_IN = process.env.TOKEN_EXPIRES_IN || '1h';

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            return res.status(400).json({
                error: 'Email and password are required',
                details: {
                    email: !email ? 'required' : 'provided',
                    password: !password ? 'required' : 'provided'
                }
            });
        }

        // Find user in SQL Server database
        const user = await Usuario.findOne({
            where: { email: email }
        });

        if (!user) {
            return res.status(401).json({
                message: 'Usuario no encontrado',
                code: 'USER_NOT_FOUND'
            });
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password);
        
        if (!isValidPassword) {
            return res.status(401).json({
                message: 'Contraseña incorrecta',
                code: 'INVALID_PASSWORD'
            });
        }

        // Generate JWT token
        const token = jwt.sign(
            { 
                userId: user.id, 
                email: user.email,
                name: user.nombre
            }, 
            SECRET_KEY,
            { expiresIn: TOKEN_EXPIRES_IN }
        );

        // Successful response
        res.json({
            message: 'Inicio de sesión exitoso',
            token,
            expiresIn: TOKEN_EXPIRES_IN,
            user: {
                id: user.id,
                name: user.nombre,
                email: user.email
            }
        });
    } catch (error) {
        handleError(res, error, 'Error interno del servidor');
    }
};

module.exports = { login };