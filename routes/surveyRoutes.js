const express = require('express');
const router = express.Router();
const { crearRelevamiento, obtenerRelevamientos } = require('../controllers/surveyController');

// Ruta para crear (POST) y obtener (GET)
router.post('/', crearRelevamiento);
router.get('/', obtenerRelevamientos);

module.exports = router;