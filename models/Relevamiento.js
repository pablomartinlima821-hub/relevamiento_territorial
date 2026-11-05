const mongoose = require('mongoose');

const relevamientoSchema = new mongoose.Schema({
    barrio: { type: String, required: true },
    nivelRioParana: { type: Number, required: true },
    estadoEvacuacion: { type: Boolean, default: false },
    coordenadas: {
        lat: { type: Number, required: true },
        lng: { type: Number, required: true }
    },
    fechaRegistro: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Relevamiento', relevamientoSchema);