const express = require('express');
const router = express.Router();
const Formulario_tablaController = require('../controllers/formulario_tabla.controller');

// CRUD Endpoints
router.get('/', Formulario_tablaController.getAll);
router.post('/', Formulario_tablaController.createOrUpdate);
router.get('/:id', Formulario_tablaController.getById);
router.delete('/:id', Formulario_tablaController.deactivate);

module.exports = router;