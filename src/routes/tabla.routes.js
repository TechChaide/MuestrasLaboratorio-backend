const express = require('express');
const router = express.Router();
const TablaController = require('../controllers/tabla.controller');

// CRUD Endpoints
router.get('/', TablaController.getAll);
router.post('/', TablaController.createOrUpdate);
router.get('/:id', TablaController.getById);
router.delete('/:id', TablaController.deactivate);

module.exports = router;