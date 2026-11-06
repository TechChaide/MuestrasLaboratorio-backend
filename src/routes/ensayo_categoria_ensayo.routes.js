const express = require('express');
const router = express.Router();
const Ensayo_categoria_ensayoController = require('../controllers/ensayo_categoria_ensayo.controller');

// Rutas específicas — deben ir antes de '/:id' para no ser capturadas como id
router.get('/pendientes-muestra', Ensayo_categoria_ensayoController.getPendientesMuestra);
router.patch('/asignar-muestra', Ensayo_categoria_ensayoController.asignarMuestra);
router.get('/pendientes-aprobacion', Ensayo_categoria_ensayoController.getPendientesAprobacion);
router.patch('/solicitud/:codigoSolicitud/pendiente-aprobacion', Ensayo_categoria_ensayoController.marcarSolicitudPendienteAprobacion);

// CRUD Endpoints
router.get('/', Ensayo_categoria_ensayoController.getAll);
router.post('/', Ensayo_categoria_ensayoController.createOrUpdate);
router.get('/:id', Ensayo_categoria_ensayoController.getById);
router.patch('/:id/pendiente-aprobacion', Ensayo_categoria_ensayoController.marcarPendienteAprobacion);
router.patch('/:id/aprobar', Ensayo_categoria_ensayoController.aprobarEnsayo);
router.delete('/:id', Ensayo_categoria_ensayoController.deactivate);

module.exports = router;