const Usuario = require('../models/Usuario');
const Relevamiento = require('../models/Relevamiento');
const { evaluarRiesgoEvacuacion } = require('../Servicios/relevamientoServicio');

const crearFiltro = (query) => {
    const filtro = {};
    const barrio = typeof query.barrio === 'string' ? query.barrio.trim() : '';

    if (barrio) {
        const terminoSeguro = barrio.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        filtro.barrio = { $regex: terminoSeguro, $options: 'i' };
    }

    if (query.riesgo === 'critico') filtro.estadoEvacuacion = true;
    if (query.riesgo === 'sin-alerta') filtro.estadoEvacuacion = false;
    if (query.riesgo && !['critico', 'sin-alerta'].includes(query.riesgo)) {
        return { error: 'El filtro de riesgo no es válido.' };
    }

    const desde = query.desde ? new Date(query.desde) : null;
    const hasta = query.hasta ? new Date(query.hasta) : null;
    if ((desde && Number.isNaN(desde.getTime())) || (hasta && Number.isNaN(hasta.getTime()))) {
        return { error: 'Las fechas del filtro no son válidas.' };
    }
    if (desde || hasta) {
        filtro.fechaRegistro = {};
        if (desde) filtro.fechaRegistro.$gte = desde;
        if (hasta) {
            hasta.setDate(hasta.getDate() + 1);
            filtro.fechaRegistro.$lt = hasta;
        }
    }

    return { filtro };
};

const crearRegistro = async (req, res) => {
    try {
        const usuario = await Usuario.findById(req.usuarioAutenticado.id).select('nombre email');
        if (!usuario) {
            return res.status(401).json({ mensaje: 'La cuenta asociada a esta sesión ya no existe.' });
        }

        const nivelRioParana = Number(req.body.nivelRioParana);
        const nuevoRelevamiento = new Relevamiento({
            barrio: req.body.barrio.trim(),
            nivelRioParana,
            estadoEvacuacion: evaluarRiesgoEvacuacion(nivelRioParana),
            coordenadas: {
                lat: Number(req.body.coordenadas.lat),
                lng: Number(req.body.coordenadas.lng)
            },
            personasAfectadas: req.body.personasAfectadas === undefined ? 0 : Number(req.body.personasAfectadas),
            necesidades: typeof req.body.necesidades === 'string' ? req.body.necesidades.trim() : '',
            observaciones: typeof req.body.observaciones === 'string' ? req.body.observaciones.trim() : '',
            registradoPor: { nombre: usuario.nombre, email: usuario.email }
        });

        await nuevoRelevamiento.save();
        return res.status(201).json({ mensaje: 'Relevamiento guardado.', data: nuevoRelevamiento });
    } catch (error) {
        return res.status(500).json({ mensaje: 'Error al guardar el relevamiento.', error: error.message });
    }
};

const obtenerRegistros = async (req, res) => {
    try {
        const resultadoFiltro = crearFiltro(req.query);
        if (resultadoFiltro.error) return res.status(400).json({ mensaje: resultadoFiltro.error });

        const relevamientos = await Relevamiento.find(resultadoFiltro.filtro)
            .sort({ fechaRegistro: -1 })
            .limit(500)
            .lean();
        return res.status(200).json(relevamientos);
    } catch (error) {
        return res.status(500).json({ mensaje: 'Error al obtener los relevamientos.', error: error.message });
    }
};

const obtenerResumen = async (req, res) => {
    try {
        const resultadoFiltro = crearFiltro(req.query);
        if (resultadoFiltro.error) return res.status(400).json({ mensaje: resultadoFiltro.error });

        const [estadisticas] = await Relevamiento.aggregate([
            { $match: resultadoFiltro.filtro },
            {
                $group: {
                    _id: null,
                    total: { $sum: 1 },
                    criticos: { $sum: { $cond: ['$estadoEvacuacion', 1, 0] } },
                    personasAfectadas: { $sum: { $ifNull: ['$personasAfectadas', 0] } }
                }
            }
        ]);
        const ultimo = await Relevamiento.findOne(resultadoFiltro.filtro)
            .sort({ fechaRegistro: -1 })
            .select('fechaRegistro barrio')
            .lean();

        return res.status(200).json({
            total: estadisticas?.total || 0,
            criticos: estadisticas?.criticos || 0,
            personasAfectadas: estadisticas?.personasAfectadas || 0,
            ultimo
        });
    } catch (error) {
        return res.status(500).json({ mensaje: 'Error al calcular el resumen.', error: error.message });
    }
};

const escaparCsv = (valor) => {
    let texto = String(valor ?? '');
    if (/^[\s]*[=+\-@]/.test(texto)) texto = `'${texto}`;
    return `"${texto.replace(/"/g, '""')}"`;
};

const exportarCsv = async (req, res) => {
    try {
        const resultadoFiltro = crearFiltro(req.query);
        if (resultadoFiltro.error) return res.status(400).json({ mensaje: resultadoFiltro.error });

        const relevamientos = await Relevamiento.find(resultadoFiltro.filtro)
            .sort({ fechaRegistro: -1 })
            .lean();
        const encabezados = [
            'Fecha', 'Barrio', 'Nivel del río (m)', 'Riesgo estimado',
            'Personas afectadas', 'Necesidades', 'Observaciones',
            'Latitud', 'Longitud', 'Registrado por', 'Correo del responsable'
        ];
        const filas = relevamientos.map((registro) => [
            registro.fechaRegistro?.toISOString(),
            registro.barrio,
            registro.nivelRioParana,
            registro.estadoEvacuacion ? 'Requiere atención (umbral del proyecto)' : 'Sin alerta automática',
            registro.personasAfectadas || 0,
            registro.necesidades,
            registro.observaciones,
            registro.coordenadas?.lat,
            registro.coordenadas?.lng,
            registro.registradoPor?.nombre,
            registro.registradoPor?.email
        ]);
        const csv = [encabezados, ...filas].map((fila) => fila.map(escaparCsv).join(',')).join('\r\n');

        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', 'attachment; filename="relevamientos.csv"');
        return res.status(200).send(`\uFEFF${csv}`);
    } catch (error) {
        return res.status(500).json({ mensaje: 'Error al exportar los relevamientos.', error: error.message });
    }
};

// NUEVA FUNCIÓN PARA ACTUALIZAR REGISTROS
const actualizarRegistro = async (req, res) => {
    try {
        const { id } = req.params;
        const nivelRioParana = req.body.nivelRioParana !== undefined ? Number(req.body.nivelRioParana) : undefined;

        const datosActualizados = {
            ...(req.body.barrio && { barrio: req.body.barrio.trim() }),
            ...(nivelRioParana !== undefined && {
                nivelRioParana,
                estadoEvacuacion: evaluarRiesgoEvacuacion(nivelRioParana)
            }),
            ...(req.body.coordenadas && {
                coordenadas: {
                    lat: Number(req.body.coordenadas.lat),
                    lng: Number(req.body.coordenadas.lng)
                }
            }),
            ...(req.body.personasAfectadas !== undefined && { personasAfectadas: Number(req.body.personasAfectadas) }),
            ...(typeof req.body.necesidades === 'string' && { necesidades: req.body.necesidades.trim() }),
            ...(typeof req.body.observaciones === 'string' && { observaciones: req.body.observaciones.trim() })
        };

        const registroActualizado = await Relevamiento.findByIdAndUpdate(
            id,
            datosActualizados,
            { new: true, runValidators: true }
        );

        if (!registroActualizado) {
            return res.status(404).json({ mensaje: 'Registro de relevamiento no encontrado.' });
        }

        return res.status(200).json({ mensaje: 'Relevamiento actualizado exitosamente.', data: registroActualizado });
    } catch (error) {
        return res.status(500).json({ mensaje: 'Error al actualizar el relevamiento.', error: error.message });
    }
};

module.exports = { 
    crearRegistro, 
    exportarCsv, 
    obtenerRegistros, 
    obtenerResumen, 
    actualizarRegistro 
};