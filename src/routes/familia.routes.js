const express = require('express');
const router = express.Router();
const FamiliaController = require('../controllers/familia.controller');

// CRUD Endpoints
router.get('/', FamiliaController.getAll);
router.post('/', FamiliaController.createOrUpdate);
router.get('/:id', FamiliaController.getById);
router.delete('/:id', FamiliaController.deactivate);

module.exports = router;