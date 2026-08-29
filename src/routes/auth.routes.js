const express = require('express');
const router = express.Router();
const { login } = require('../controllers/auth.controller');

// Authentication routes for SQL Server
router.post('/login', login);

module.exports = router;