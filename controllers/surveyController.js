const Relevamiento = require('../models/Relevamiento');
const { evaluarRiesgoEvacuacion } = require('../Servicios/relevamientoServicio');

const crearRegistro = async (req, res) => {
    try {
        const datos = req.body;
        // Evaluar riesgo usando el servicio
        datos.estadoEvacuacion = evaluarRiesgoEvacuacion(datos.nivelRioParana);
        
        const nuevoRelevamiento = new Relevamiento(datos);
        await nuevoRelevamiento.save();
        
        res.status(201).json({ mensaje: 'Relevamiento guardado', data: nuevoRelevamiento });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error interno del servidor', error: error.message });
    }
};

module.exports = { crearRegistro };