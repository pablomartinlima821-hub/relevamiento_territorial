const evaluarRiesgoEvacuacion = (nivelRio) => {
    // Si el nivel en Goya supera la marca de alerta en la costa
    return nivelRio >= 5.20; 
};

module.exports = { evaluarRiesgoEvacuacion };