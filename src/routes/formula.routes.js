const express = require('express');
const router = express.Router();
const FormulaController = require('../controllers/formula.controller');

router.get('/por-tabla', FormulaController.getByTabla);

// CRUD Endpoints
router.get('/', FormulaController.getAll);
router.post('/', FormulaController.createOrUpdate);
router.get('/:id', FormulaController.getById);
router.delete('/:id', FormulaController.deactivate);

module.exports = router;