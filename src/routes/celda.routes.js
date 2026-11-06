const express = require('express');
const router = express.Router();
const CeldaController = require('../controllers/celda.controller');

router.get('/por-tabla', CeldaController.getByTabla);

// CRUD Endpoints
router.get('/', CeldaController.getAll);
router.post('/', CeldaController.createOrUpdate);
router.get('/:id', CeldaController.getById);
router.delete('/:id', CeldaController.deactivate);

module.exports = router;