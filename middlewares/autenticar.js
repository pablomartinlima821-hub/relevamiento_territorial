const jwt = require('jsonwebtoken');

const autenticar = (req, res, next) => {
    const authorization = req.headers.authorization;
    const [scheme, token] = typeof authorization === 'string' ? authorization.split(' ') : [];

    if (scheme !== 'Bearer' || !token) {
        return res.status(401).json({ mensaje: 'Debes iniciar sesión para acceder a los relevamientos.' });
    }

    try {
        req.usuarioAutenticado = jwt.verify(token, process.env.JWT_SECRET || 'secreto_super_seguro');
        return next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            return res.status(401).json({ mensaje: 'La sesión es inválida o expiró. Inicia sesión nuevamente.' });
        }
        return next(error);
    }
};

module.exports = autenticar;
