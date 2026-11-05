const mongoose = require('mongoose');

const surveySchema = new mongoose.Schema({
    zona: { type: String, required: true },
    nivelAguaMetros: { type: Number, required: true },
    nivelRiesgo: { type: String, enum: ['Bajo', 'Medio', 'Alto', 'Crítico'], required: true },
    coordenadas: {
        lat: { type: Number, required: true },
        lng: { type: Number, required: true }
    },
    observaciones: { type: String },
    fechaRegistro: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Survey', surveySchema);