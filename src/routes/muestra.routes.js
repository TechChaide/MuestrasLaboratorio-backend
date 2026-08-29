const express = require('express');
const router = express.Router();
const MuestraController = require('../controllers/muestra.controller');

// CRUD Endpoints
router.get('/', MuestraController.getAll);
router.post('/', MuestraController.createOrUpdate);
router.get('/:id', MuestraController.getById);
router.delete('/:id', MuestraController.deactivate);

module.exports = router;