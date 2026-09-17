const express = require('express');
const router = express.Router();
const SolicitudController = require('../controllers/solicitud.controller');

// CRUD Endpoints
router.get('/', SolicitudController.getAll);
router.post('/', SolicitudController.createOrUpdate);
router.post('/getUltimaSolicitud', SolicitudController.getUltimaSolicitud);
router.get('/:id', SolicitudController.getById);
router.delete('/:id', SolicitudController.deactivate);

module.exports = router;