const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

// Import routes
const celdaRoutes = require('./routes/celda.routes');
const columnaRoutes = require('./routes/columna.routes');
const dependenciasRoutes = require('./routes/dependencias.routes');
const ensayo_categoria_ensayoRoutes = require('./routes/ensayo_categoria_ensayo.routes');
const familiaRoutes = require('./routes/familia.routes');
const formulaRoutes = require('./routes/formula.routes');
const formularioRoutes = require('./routes/formulario.routes');
const formulario_tablaRoutes = require('./routes/formulario_tabla.routes');
const muestraRoutes = require('./routes/muestra.routes');
const resultadoRoutes = require('./routes/resultado.routes');
const solicitudRoutes = require('./routes/solicitud.routes');
const tablaRoutes = require('./routes/tabla.routes');
const tipo_ensayoRoutes = require('./routes/tipo_ensayo.routes');
const authRoutes = require('./routes/auth.routes');

const app = express();

// Middleware
app.use(cors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true
}));

app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        message: 'SQL Server API is running',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// API Routes
app.use('/api/celda', celdaRoutes);
app.use('/api/columna', columnaRoutes);
app.use('/api/dependencias', dependenciasRoutes);
app.use('/api/ensayo_categoria_ensayo', ensayo_categoria_ensayoRoutes);
app.use('/api/familia', familiaRoutes);
app.use('/api/formula', formulaRoutes);
app.use('/api/formulario', formularioRoutes);
app.use('/api/formulario_tabla', formulario_tablaRoutes);
app.use('/api/muestra', muestraRoutes);
app.use('/api/resultado', resultadoRoutes);
app.use('/api/solicitud', solicitudRoutes);
app.use('/api/tabla', tablaRoutes);
app.use('/api/tipo_ensayo', tipo_ensayoRoutes);
app.use('/api/auth', authRoutes);

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Endpoint not found',
        path: req.originalUrl,
        method: req.method
    });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
    });
});

module.exports = app;