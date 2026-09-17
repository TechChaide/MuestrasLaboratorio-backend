const express = require('express');
const router = express.Router();
const informeController = require('../controllers/informe.controller');

// Auth global en app.js (requireApiAuth).
router.post('/enviar-resultados', informeController.enviarResultados);

module.exports = router;
