const express = require('express');
const router = express.Router();
const ResultadoController = require('../controllers/resultado.controller');

// CRUD Endpoints
router.get('/', ResultadoController.getAll);
router.post('/', ResultadoController.createOrUpdate);
router.get('/:id', ResultadoController.getById);
router.delete('/:id', ResultadoController.deactivate);

module.exports = router;