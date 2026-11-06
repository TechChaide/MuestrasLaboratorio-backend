const express = require('express');
const router = express.Router();
const FormularioController = require('../controllers/formulario.controller');

// CRUD Endpoints
router.get('/', FormularioController.getAll);
router.post('/', FormularioController.createOrUpdate);
router.get('/:id/tablas', FormularioController.getTablas);
router.get('/:id', FormularioController.getById);
router.delete('/:id', FormularioController.deactivate);

module.exports = router;