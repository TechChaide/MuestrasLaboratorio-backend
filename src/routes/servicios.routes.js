const express = require('express');
const router = express.Router();
const serviciosController = require('../controllers/servicios.controller');

// Auth global en app.js (requireApiAuth).
// GET /api/servicios/materiales/buscar?Busqueda=pla
router.get('/materiales/buscar', serviciosController.buscarMaterialesAsYouType);

module.exports = router;
