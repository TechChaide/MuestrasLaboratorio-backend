const express = require('express');
const router = express.Router();
const Tipo_ensayoController = require('../controllers/tipo_ensayo.controller');

// CRUD Endpoints
router.get('/', Tipo_ensayoController.getAll);
router.post('/', Tipo_ensayoController.createOrUpdate);
router.get('/:id', Tipo_ensayoController.getById);
router.delete('/:id', Tipo_ensayoController.deactivate);

module.exports = router;