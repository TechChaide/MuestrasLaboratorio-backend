const express = require('express');
const router = express.Router();
const ResultadoController = require('../controllers/resultado.controller');

// Ruta específica — debe ir antes de '/:id' para no ser capturada como id
router.get('/por-ensayo', ResultadoController.getByEnsayos);
router.get('/por-ensayo-tabla', ResultadoController.getPorEnsayoTabla);

// CRUD Endpoints
router.get('/', ResultadoController.getAll);
router.post('/', ResultadoController.createOrUpdate);
router.get('/:id', ResultadoController.getById);
router.delete('/:id', ResultadoController.deactivate);

module.exports = router;