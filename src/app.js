const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
require('dotenv').config();

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
const serviciosRoutes = require('./routes/servicios.routes');
const solicitudRoutes = require('./routes/solicitud.routes');
const tablaRoutes = require('./routes/tabla.routes');
const tipo_ensayoRoutes = require('./routes/tipo_ensayo.routes');
const authRoutes = require('./routes/auth.routes');
const informeRoutes = require('./routes/informe.routes');
const { verifyToken } = require('./middlewares/auth.middleware');

const app = express();

// Mismo patrón que muestreos-backend: CORS + cookies + JWT vía seguridades.
app.use(cors({
    origin: function (origin, callback) {
        callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Access-Token', 'X-Auth-Token', 'Accept', 'Origin'],
}));

app.use(cookieParser());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        message: 'SQL Server API is running',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
    });
});

// Login local (si se usa) — público
app.use('/api/auth', authRoutes);

// Resto: verifyToken → checkToken de seguridades (igual que muestreos)
app.use('/api/celda', verifyToken, celdaRoutes);
app.use('/api/columna', verifyToken, columnaRoutes);
app.use('/api/dependencias', verifyToken, dependenciasRoutes);
app.use('/api/ensayo_categoria_ensayo', verifyToken, ensayo_categoria_ensayoRoutes);
app.use('/api/familia', verifyToken, familiaRoutes);
app.use('/api/formula', verifyToken, formulaRoutes);
app.use('/api/formulario', verifyToken, formularioRoutes);
app.use('/api/formulario_tabla', verifyToken, formulario_tablaRoutes);
app.use('/api/muestra', verifyToken, muestraRoutes);
app.use('/api/resultado', verifyToken, resultadoRoutes);
app.use('/api/servicios', verifyToken, serviciosRoutes);
app.use('/api/solicitud', verifyToken, solicitudRoutes);
app.use('/api/tabla', verifyToken, tablaRoutes);
app.use('/api/tipo_ensayo', verifyToken, tipo_ensayoRoutes);
app.use('/api/informes', verifyToken, informeRoutes);

app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Endpoint not found',
        path: req.originalUrl,
        method: req.method,
    });
});

app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
    });
});

module.exports = app;
