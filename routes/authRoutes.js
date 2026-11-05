const express = require('express');
const router = express.Router();
const { solicitarTokenGmail, verificarTokenGmail } = require('../controllers/authController');

router.post('/solicitar-token', solicitarTokenGmail);
router.post('/verificar-token', verificarTokenGmail);

module.exports = router;