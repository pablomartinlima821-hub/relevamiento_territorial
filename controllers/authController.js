const Usuario = require('../models/Usuario');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');

// Configuración del transporter de correo (Gmail)
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER, // Tu correo configurado en el .env
        pass: process.env.EMAIL_PASS  // Tu contraseña de aplicación de Gmail
    }
});

// 1. Solicitar código de acceso por Gmail
const solicitarTokenGmail = async (req, res) => {
    try {
        const { email } = req.body;
        let usuario = await Usuario.findOne({ email });

        if (!usuario) {
            return res.status(404).json({ mensaje: 'Correo no registrado en el sistema de relevamiento.' });
        }

        // Generar código aleatorio de 6 dígitos
        const codigoToken = Math.floor(100000 + Math.random() * 900000).toString();
        
        // Expira en 10 minutos
        usuario.tokenAcceso = codigoToken;
        usuario.tokenExpiracion = Date.now() + 10 * 60 * 1000;
        await usuario.save();

        // Enviar correo
        await transporter.sendMail({
            from: '"Monitoreo Goya - El Niño" <noreply@goya.gov.ar>',
            to: email,
            subject: 'Código de Acceso - Relevamiento Territorial',
            text: `Tu código de acceso temporal es: ${codigoToken}. Este código expira en 10 minutos.`
        });

        res.status(200).json({ mensaje: 'Código de acceso enviado con éxito a tu correo.' });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al enviar el correo', error: error.message });
    }
};

// 2. Verificar el código de Gmail y otorgar sesión JWT
const verificarTokenGmail = async (req, res) => {
    try {
        const { email, codigo } = req.body;
        const usuario = await Usuario.findOne({ email });

        if (!usuario || usuario.tokenAcceso !== codigo || usuario.tokenExpiracion < Date.now()) {
            return res.status(400).json({ mensaje: 'Código inválido o expirado.' });
        }

        // Limpiar token usado
        usuario.tokenAcceso = undefined;
        usuario.tokenExpiracion = undefined;
        await usuario.save();

        // Crear Token JWT de sesión
        const tokenJwt = jwt.sign(
            { id: usuario._id, email: usuario.email, rol: usuario.rol },
            process.env.JWT_SECRET || 'secreto_super_seguro',
            { expiresIn: '8h' }
        );

        res.status(200).json({ 
            mensaje: 'Autenticación exitosa', 
            token: tokenJwt,
            usuario: { nombre: usuario.nombre, email: usuario.email, rol: usuario.rol }
        });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error en la verificación', error: error.message });
    }
};

module.exports = { solicitarTokenGmail, verificarTokenGmail };