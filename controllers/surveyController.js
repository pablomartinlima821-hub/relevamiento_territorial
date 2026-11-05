const Survey = require('../models/Survey');

// Crear un nuevo relevamiento
const crearRelevamiento = async (req, res) => {
    try {
        const nuevoRelevamiento = new Survey(req.body);
        await nuevoRelevamiento.save();
        res.status(201).json({ mensaje: 'Relevamiento guardado con éxito', data: nuevoRelevamiento });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al guardar el relevamiento', error: error.message });
    }
};

// Obtener todos los relevamientos
const obtenerRelevamientos = async (req, res) => {
    try {
        const relevamientos = await Survey.find().sort({ fechaRegistro: -1 }); // Ordenados por el más reciente
        res.status(200).json(relevamientos);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener los datos', error: error.message });
    }
};

module.exports = { crearRelevamiento, obtenerRelevamientos };