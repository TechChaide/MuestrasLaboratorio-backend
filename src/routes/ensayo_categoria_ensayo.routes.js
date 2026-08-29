const express = require('express');
const router = express.Router();
const Ensayo_categoria_ensayoController = require('../controllers/ensayo_categoria_ensayo.controller');

// CRUD Endpoints
router.get('/', Ensayo_categoria_ensayoController.getAll);
router.post('/', Ensayo_categoria_ensayoController.createOrUpdate);
router.get('/:id', Ensayo_categoria_ensayoController.getById);
router.delete('/:id', Ensayo_categoria_ensayoController.deactivate);

module.exports = router;