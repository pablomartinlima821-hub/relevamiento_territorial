const Relevamiento = require('../models/Relevamiento');
const { evaluarRiesgoEvacuacion } = require('../Servicios/relevamientoServicio');

const crearRegistro = async (req, res) => {
    try {
        const datos = req.body;
        datos.estadoEvacuacion = evaluarRiesgoEvacuacion(datos.nivelRioParana);
        
        const nuevoRelevamiento = new Relevamiento(datos);
        await nuevoRelevamiento.save();
        
        res.status(201).json({ mensaje: 'Relevamiento guardado', data: nuevoRelevamiento });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error interno del servidor', error: error.message });
    }
};

const obtenerRegistros = async (req, res) => {
    try {
        const relevamientos = await Relevamiento.find().sort({ fechaRegistro: -1 });
        res.status(200).json(relevamientos);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener los datos', error: error.message });
    }
};

module.exports = { crearRegistro, obtenerRegistros };