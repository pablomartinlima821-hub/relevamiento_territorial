const { body, validationResult } = require('express-validator');

const validarRelevamiento = [
    body('barrio').notEmpty().withMessage('El barrio es obligatorio'),
    body('nivelRioParana').isFloat({ min: 0 }).withMessage('El nivel del río debe ser un número positivo'),
    body('coordenadas.lat').isFloat({ min: -29.5, max: -29.0 }).withMessage('Latitud fuera del rango territorial (Goya)'),
    body('coordenadas.lng').isFloat({ min: -59.5, max: -59.0 }).withMessage('Longitud fuera del rango territorial (Goya)'),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errores: errors.array() });
        }
        next();
    }
];

module.exports = { validarRelevamiento };