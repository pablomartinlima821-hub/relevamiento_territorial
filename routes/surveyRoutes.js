const express = require('express');
const router = express.Router();
const { crearRegistro } = require('../controllers/surveyController');
const { validarRelevamiento } = require('../middlewares/validador');

// Ruta que pasa por el middleware de validación antes de llegar al controlador
router.post('/', validarRelevamiento, crearRegistro);

module.exports = router;