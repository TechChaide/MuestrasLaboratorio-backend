const express = require('express');
const router = express.Router();
const DependenciasController = require('../controllers/dependencias.controller');

// CRUD Endpoints
router.get('/', DependenciasController.getAll);
router.post('/', DependenciasController.createOrUpdate);
router.get('/:id', DependenciasController.getById);
router.delete('/:id', DependenciasController.deactivate);

module.exports = router;