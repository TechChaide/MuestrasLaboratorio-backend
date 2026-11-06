const express = require('express');
const router = express.Router();
const ColumnaController = require('../controllers/columna.controller');

router.get('/por-tabla', ColumnaController.getByTabla);

// CRUD Endpoints
router.get('/', ColumnaController.getAll);
router.post('/', ColumnaController.createOrUpdate);
router.get('/:id', ColumnaController.getById);
router.delete('/:id', ColumnaController.deactivate);

module.exports = router;