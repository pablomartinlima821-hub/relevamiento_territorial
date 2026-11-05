const express = require('express');
const router = express.Router();
const { crearRegistro, obtenerRegistros } = require('../controllers/surveyController');
const { validarRelevamiento } = require('../middlewares/validador');

router.post('/', validarRelevamiento, crearRegistro);
router.get('/', obtenerRegistros);

module.exports = router;