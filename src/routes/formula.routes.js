const express = require('express');
const router = express.Router();
const FormulaController = require('../controllers/formula.controller');

// CRUD Endpoints
router.get('/', FormulaController.getAll);
router.post('/', FormulaController.createOrUpdate);
router.get('/:id', FormulaController.getById);
router.delete('/:id', FormulaController.deactivate);

module.exports = router;