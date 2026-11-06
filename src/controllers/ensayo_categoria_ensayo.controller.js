const { Ensayo_categoria_ensayo, Solicitud, Formulario, Muestra, Tipo_ensayo, sequelize } = require('../models');
const { handleError } = require('../helpers/error.helper');
const {
    enviarNotificacionAsignacionEnsayo,
    enviarNotificacionCulminacionFase,
    enviarNotificacionCulminacionSolicitud,
    enviarNotificacionResultadosEnsayo,
    enviarNotificacionAprobacionEnsayo,
    enviarNotificacionRechazoEnsayo,
} = require('../mailer/mailer');

// Estados válidos de codigo_estado_aprobacion: 'PA' pendiente (asignado
// automáticamente al culminar la captura), 'AP' aprobado, 'RE' rechazado.

module.exports = {
    // Create or update record
    createOrUpdate: async (req, res) => {
        try {
            const {
                codigo_ensayo_categoria_ensayo,
                codigo_solicitud,
                codigo_muestra,
                codigo_tipo_ensayo,
                codigo_formulario,
                responsable_ensayo,
                correo_responsable_ensayo,
                fecha_inicio,
                fecha_fin,
                fecha_extension,
                estado,
                fecha_creacion,
                usuario_creacion,
                codigo_estado_aprobacion,
                usuario_aprobacion,
                fecha_aprobacion,
                observaciones_aprobacion
            } = req.body;

            // Validate required fields

            if (codigo_ensayo_categoria_ensayo == 0 || codigo_ensayo_categoria_ensayo === undefined) {
                // Create new record
                const newRecord = await Ensayo_categoria_ensayo.create({
                    codigo_solicitud: codigo_solicitud,
                    codigo_muestra: codigo_muestra,
                    codigo_tipo_ensayo: codigo_tipo_ensayo,
                    codigo_formulario: codigo_formulario,
                    responsable_ensayo: responsable_ensayo,
                    correo_responsable_ensayo: correo_responsable_ensayo,
                    fecha_inicio: fecha_inicio,
                    fecha_fin: fecha_fin,
                    fecha_extension: fecha_extension,
                    estado: estado,
                    fecha_creacion: fecha_creacion,
                    usuario_creacion: usuario_creacion,
                    codigo_estado_aprobacion: codigo_estado_aprobacion,
                    usuario_aprobacion: usuario_aprobacion,
                    fecha_aprobacion: fecha_aprobacion,
                    observaciones_aprobacion: observaciones_aprobacion
                });

                const response = await Ensayo_categoria_ensayo.findByPk(newRecord.codigo_ensayo_categoria_ensayo, {
                    include: [
                        { model: Formulario, as: 'formulario' },
                        { model: Muestra, as: 'muestra' },
                        { model: Solicitud, as: 'solicitud' },
                        { model: Tipo_ensayo, as: 'tipo_ensayo' }
                    ]
                });

                return res.status(201).json({
                    data: response,
                    length: 1
                });
            } else {
                // Update existing record
                const record = await Ensayo_categoria_ensayo.findByPk(codigo_ensayo_categoria_ensayo, {
                    include: [
                        { model: Formulario, as: 'formulario' },
                        { model: Muestra, as: 'muestra' },
                        { model: Solicitud, as: 'solicitud' },
                        { model: Tipo_ensayo, as: 'tipo_ensayo' }
                    ]
                });

                if (!record) {
                    return res.status(404).json({ error: 'Record not found' });
                }

                // Se notifica la asignación (2.2) solo cuando el ensayo pasa de no
                // tener responsable a tenerlo (o cambia de responsable), no en cada
                // guardado — así evita reenviar el correo en cada edición posterior.
                const seAsignaResponsableNuevo = responsable_ensayo !== undefined
                    && responsable_ensayo
                    && responsable_ensayo !== record.responsable_ensayo;

                // Update fields
                if (codigo_solicitud !== undefined) record.codigo_solicitud = codigo_solicitud;
                if (codigo_muestra !== undefined) record.codigo_muestra = codigo_muestra;
                if (codigo_tipo_ensayo !== undefined) record.codigo_tipo_ensayo = codigo_tipo_ensayo;
                if (codigo_formulario !== undefined) record.codigo_formulario = codigo_formulario;
                if (responsable_ensayo !== undefined) record.responsable_ensayo = responsable_ensayo;
                if (correo_responsable_ensayo !== undefined) record.correo_responsable_ensayo = correo_responsable_ensayo;
                if (fecha_inicio !== undefined) record.fecha_inicio = fecha_inicio;
                if (fecha_fin !== undefined) record.fecha_fin = fecha_fin;
                if (fecha_extension !== undefined) record.fecha_extension = fecha_extension;
                if (estado !== undefined) record.estado = estado;
                if (fecha_creacion !== undefined) record.fecha_creacion = fecha_creacion;
                if (usuario_creacion !== undefined) record.usuario_creacion = usuario_creacion;
                if (codigo_estado_aprobacion !== undefined) record.codigo_estado_aprobacion = codigo_estado_aprobacion;
                if (usuario_aprobacion !== undefined) record.usuario_aprobacion = usuario_aprobacion;
                if (fecha_aprobacion !== undefined) record.fecha_aprobacion = fecha_aprobacion;
                if (observaciones_aprobacion !== undefined) record.observaciones_aprobacion = observaciones_aprobacion;

                await record.save();

                if (seAsignaResponsableNuevo) {
                    const correoDestino = record.correo_responsable_ensayo || '';
                    enviarNotificacionAsignacionEnsayo(correoDestino, {
                        identificador_ensayo: record.solicitud?.identificador_ensayo,
                        nombre_tipo_ensayo: record.tipo_ensayo?.nombre_tipo_ensayo,
                        responsable_ensayo: record.responsable_ensayo,
                        fecha_inicio: record.fecha_inicio,
                        fecha_fin: record.fecha_fin
                    }).catch((err) => console.error('No se pudo enviar notificación de asignación de ensayo:', err));
                }

                const updatedRecord = await Ensayo_categoria_ensayo.findByPk(codigo_ensayo_categoria_ensayo, {
                    include: [
                        { model: Formulario, as: 'formulario' },
                        { model: Muestra, as: 'muestra' },
                        { model: Solicitud, as: 'solicitud' },
                        { model: Tipo_ensayo, as: 'tipo_ensayo' }
                    ]
                });

                return res.status(200).json({
                    data: updatedRecord,
                    length: 1
                });
            }
        } catch (error) {
            handleError(res, error, 'Error creating or updating record');
        }
    },

    // Get all records
    getAll: async (req, res) => {
        try {
            const { page = 1, limit = 10000 } = req.query;
            const offset = (page - 1) * limit;

            const { count, rows } = await Ensayo_categoria_ensayo.findAndCountAll({
                limit: parseInt(limit),
                offset: parseInt(offset),
                where: { estado: 'A' },
                include: [
                    // formulario y muestra son opcionales en este punto del flujo (un
                    // requerimiento recién creado aún no tiene ninguno de los dos) — con
                    // where sin required:false, Sequelize las volvía INNER JOIN y
                    // ocultaba TODAS las filas sin formulario/muestra asignados.
                    { model: Formulario, as: 'formulario', where: { estado: 'A' }, required: false },
                    { model: Muestra, as: 'muestra', where: { estado: 'A' }, required: false },
                    { model: Solicitud, as: 'solicitud', where: { estado: 'A' } },
                    { model: Tipo_ensayo, as: 'tipo_ensayo', where: { estado: 'A' } }
                ]
            });

            return res.status(200).json({
                data: rows,
                length: rows.length,
                total: count,
                page: parseInt(page),
                totalPages: Math.ceil(count / limit)
            });
        } catch (error) {
            handleError(res, error, 'Error fetching records');
        }
    },

    // Get record by ID
    getById: async (req, res) => {
        try {
            const { id } = req.params;
            
            const record = await Ensayo_categoria_ensayo.findByPk(id, {
                include: [
                    { model: Formulario, as: 'formulario' },
                    { model: Muestra, as: 'muestra' },
                    { model: Solicitud, as: 'solicitud' },
                    { model: Tipo_ensayo, as: 'tipo_ensayo' }
                ]
            });

            if (!record) {
                return res.status(404).json({ 
                    error: 'Record not found',
                    id: id
                });
            }

            return res.status(200).json({
                data: record,
                length: 1
            });
        } catch (error) {
            handleError(res, error, 'Error fetching record by ID');
        }
    },

    // Registros activos sin muestra asignada aún (pendientes de carga de muestra),
    // con su solicitud y tipo de ensayo para poder mostrarlos agrupados en el wizard.
    getPendientesMuestra: async (req, res) => {
        try {
            const rows = await Ensayo_categoria_ensayo.findAll({
                where: { estado: 'A', codigo_muestra: null },
                include: [
                    { model: Solicitud, as: 'solicitud', where: { estado: 'A' }, required: true },
                    { model: Tipo_ensayo, as: 'tipo_ensayo', where: { estado: 'A' }, required: false }
                ],
                order: [['codigo_solicitud', 'ASC'], ['codigo_ensayo_categoria_ensayo', 'ASC']]
            });

            return res.status(200).json({
                data: rows,
                length: rows.length
            });
        } catch (error) {
            handleError(res, error, 'Error fetching pending ensayo_categoria_ensayo records');
        }
    },

    // Asigna una muestra recién cargada a uno o más registros pendientes en un solo round-trip.
    asignarMuestra: async (req, res) => {
        try {
            const { codigo_muestra, ids } = req.body;

            if (!codigo_muestra) {
                return res.status(400).json({ error: 'codigo_muestra es requerido' });
            }
            if (!Array.isArray(ids) || ids.length === 0) {
                return res.status(400).json({ error: 'ids debe ser un arreglo con al menos un elemento' });
            }

            const [updated] = await Ensayo_categoria_ensayo.update(
                { codigo_muestra },
                { where: { codigo_ensayo_categoria_ensayo: ids, codigo_muestra: null } }
            );

            return res.status(200).json({
                message: 'Muestra asignada correctamente',
                updated
            });
        } catch (error) {
            handleError(res, error, 'Error assigning muestra to ensayo_categoria_ensayo records');
        }
    },

    // Ensayos con captura de datos culminada, pendientes de revisión/aprobación
    // (ver vista de aprobación de resultados en el frontend).
    getPendientesAprobacion: async (req, res) => {
        try {
            const rows = await Ensayo_categoria_ensayo.findAll({
                where: { estado: 'A', codigo_estado_aprobacion: 'PA' },
                include: [
                    { model: Solicitud, as: 'solicitud' },
                    { model: Muestra, as: 'muestra' },
                    { model: Tipo_ensayo, as: 'tipo_ensayo' },
                    { model: Formulario, as: 'formulario' }
                ],
                order: [['fecha_aprobacion', 'ASC'], ['codigo_ensayo_categoria_ensayo', 'ASC']]
            });

            return res.status(200).json({ data: rows, length: rows.length });
        } catch (error) {
            handleError(res, error, 'Error fetching pending-approval ensayo_categoria_ensayo records');
        }
    },

    // Transiciona el ensayo a "pendiente de aprobación" (lo llama el frontend
    // cuando la captura de datos llega al 100%) y notifica al equipo revisor
    // (2.3 — ver mailer.js). El envío de correo es best-effort: si falla, se
    // registra en logs pero NO revierte el cambio de estado.
    marcarPendienteAprobacion: async (req, res) => {
        try {
            const { id } = req.params;
            const { correos } = req.body;

            const record = await Ensayo_categoria_ensayo.findByPk(id, {
                include: [
                    { model: Solicitud, as: 'solicitud' },
                    { model: Tipo_ensayo, as: 'tipo_ensayo' }
                ]
            });
            if (!record) {
                return res.status(404).json({ error: 'Record not found' });
            }

            record.codigo_estado_aprobacion = 'PA';
            await record.save();

            const destinatarios = correos || process.env.MAIL_APROBADORES || '';
            enviarNotificacionCulminacionFase(destinatarios, {
                identificador_ensayo: record.solicitud?.identificador_ensayo,
                nombre_tipo_ensayo: record.tipo_ensayo?.nombre_tipo_ensayo,
                responsable_ensayo: record.responsable_ensayo
            }).catch((err) => console.error('No se pudo enviar notificación de culminación de fase:', err));

            return res.status(200).json({ data: record });
        } catch (error) {
            handleError(res, error, 'Error marking record as pending approval');
        }
    },

    // Culminación a nivel de SOLICITUD: marca PA todos los ensayos activos de la
    // solicitud y envía UNA sola notificación al jefe (no una por tipo de ensayo).
    marcarSolicitudPendienteAprobacion: async (req, res) => {
        try {
            const { codigoSolicitud } = req.params;
            const { correos } = req.body;

            const registros = await Ensayo_categoria_ensayo.findAll({
                where: {
                    codigo_solicitud: codigoSolicitud,
                    estado: 'A',
                },
                include: [
                    { model: Solicitud, as: 'solicitud' },
                    { model: Tipo_ensayo, as: 'tipo_ensayo' },
                ],
            });

            if (!registros.length) {
                return res.status(404).json({ error: 'No hay ensayos activos para esta solicitud' });
            }

            // No re-notificar si ya todos están en PA o AP.
            const pendientes = registros.filter(
                (r) => r.codigo_estado_aprobacion !== 'PA' && r.codigo_estado_aprobacion !== 'AP'
            );

            for (const record of pendientes) {
                record.codigo_estado_aprobacion = 'PA';
                await record.save();
            }

            const identificador = registros[0].solicitud?.identificador_ensayo;
            const tipos = registros
                .map((r) => r.tipo_ensayo?.nombre_tipo_ensayo)
                .filter(Boolean);
            const responsable =
                registros.find((r) => r.responsable_ensayo)?.responsable_ensayo ||
                registros[0].responsable_ensayo;

            const destinatarios = correos || process.env.MAIL_APROBADORES || '';
            enviarNotificacionCulminacionSolicitud(destinatarios, {
                identificador_ensayo: identificador,
                tipos_ensayo: tipos,
                responsable_ensayo: responsable,
            }).catch((err) =>
                console.error('No se pudo enviar notificación de culminación de solicitud:', err)
            );

            return res.status(200).json({
                data: registros,
                updated: pendientes.length,
                alreadyPending: registros.length - pendientes.length,
            });
        } catch (error) {
            handleError(res, error, 'Error marking solicitud ensayos as pending approval');
        }
    },

    // Aprueba o rechaza el ensayo. Si se aprueba, notifica al solicitante
    // (2.4 — ver mailer.js) usando Solicitud.correos_objetivo por defecto.
    aprobarEnsayo: async (req, res) => {
        try {
            const { id } = req.params;
            const { decision, usuario_aprobacion, observaciones_aprobacion, correos } = req.body;

            if (!['AP', 'RE'].includes(decision)) {
                return res.status(400).json({ error: "decision inválida. Valores permitidos: 'AP' (aprobar), 'RE' (rechazar)" });
            }

            const record = await Ensayo_categoria_ensayo.findByPk(id, {
                include: [
                    { model: Solicitud, as: 'solicitud' },
                    { model: Tipo_ensayo, as: 'tipo_ensayo' }
                ]
            });
            if (!record) {
                return res.status(404).json({ error: 'Record not found' });
            }

            // Idempotencia: sin este guard, reenviar la decisión sobre un registro
            // ya decidido (doble clic, pestaña vieja recargando, reintento de red)
            // volvía a ejecutar toda la rama de abajo — y en el caso de rechazo,
            // eso crea un duplicado nuevo cada vez que se repite la llamada.
            if (record.estado !== 'A' || record.codigo_estado_aprobacion === 'AP' || record.codigo_estado_aprobacion === 'RE') {
                return res.status(409).json({
                    error: 'Este ensayo ya fue revisado anteriormente. Recarga la lista de pendientes de aprobación.'
                });
            }

            // GETDATE() en vez de un Date de JS: el driver mssql, con el motor de
            // BD que reporta el aviso de "engine version not supported" al
            // arrancar, serializa los DATE de Sequelize con un sufijo "+00:00"
            // que fecha_aprobacion (columna DATETIME clásica, no DATETIME2 como
            // el resto de fechas de esta tabla) no logra convertir ("Conversion
            // failed when converting date and/or time from character string" —
            // error 241). Calcular la fecha del lado del servidor evita el problema.
            let nuevoRegistroId;

            if (decision === 'AP') {
                await Ensayo_categoria_ensayo.update({
                    codigo_estado_aprobacion: decision,
                    usuario_aprobacion,
                    fecha_aprobacion: sequelize.literal('GETDATE()'),
                    observaciones_aprobacion,
                }, { where: { codigo_ensayo_categoria_ensayo: id } });
            } else {
                // Rechazo: el registro original queda desactivado (conserva sus
                // resultados capturados para auditoría, sin que un reintento los
                // sobreescriba) y se crea un duplicado activo — misma solicitud,
                // muestra, tipo de ensayo, formulario, responsable y fechas — pero
                // sin resultados ni estado de aprobación, para que el técnico
                // vuelva a capturar los valores desde cero.
                await Ensayo_categoria_ensayo.update({
                    codigo_estado_aprobacion: decision,
                    usuario_aprobacion,
                    fecha_aprobacion: sequelize.literal('GETDATE()'),
                    observaciones_aprobacion,
                    estado: 'I',
                }, { where: { codigo_ensayo_categoria_ensayo: id } });

                const nuevoRegistro = await Ensayo_categoria_ensayo.create({
                    codigo_solicitud: record.codigo_solicitud,
                    codigo_muestra: record.codigo_muestra,
                    codigo_tipo_ensayo: record.codigo_tipo_ensayo,
                    codigo_formulario: record.codigo_formulario,
                    responsable_ensayo: record.responsable_ensayo,
                    correo_responsable_ensayo: record.correo_responsable_ensayo,
                    fecha_inicio: record.fecha_inicio,
                    fecha_fin: record.fecha_fin,
                    fecha_extension: record.fecha_extension,
                    estado: 'A',
                    fecha_creacion: sequelize.literal('GETDATE()'),
                    usuario_creacion: usuario_aprobacion,
                });
                nuevoRegistroId = nuevoRegistro.codigo_ensayo_categoria_ensayo;

                record.estado = 'I';
            }

            record.codigo_estado_aprobacion = decision;
            record.usuario_aprobacion = usuario_aprobacion;
            record.observaciones_aprobacion = observaciones_aprobacion;
            record.fecha_aprobacion = new Date();

            if (decision === 'AP') {
                const destinatariosSolicitante = correos || record.solicitud?.correos_objetivo || '';
                enviarNotificacionResultadosEnsayo(destinatariosSolicitante, {
                    identificador_ensayo: record.solicitud?.identificador_ensayo,
                    nombre_tipo_ensayo: record.tipo_ensayo?.nombre_tipo_ensayo,
                    usuario_aprobacion: record.usuario_aprobacion
                }).catch((err) => console.error('No se pudo enviar notificación de resultados:', err));

                // Además del aviso al solicitante (arriba), se notifica al responsable
                // que capturó los datos que su ensayo quedó aprobado.
                enviarNotificacionAprobacionEnsayo(record.correo_responsable_ensayo || '', {
                    identificador_ensayo: record.solicitud?.identificador_ensayo,
                    nombre_tipo_ensayo: record.tipo_ensayo?.nombre_tipo_ensayo,
                    usuario_aprobacion: record.usuario_aprobacion
                }).catch((err) => console.error('No se pudo enviar notificación de aprobación al responsable:', err));
            } else {
                // Rechazo: se avisa al responsable que capturó los datos (no al
                // solicitante) para que corrija y vuelva a notificar la culminación
                // del nuevo registro que acaba de crearse arriba.
                const destinatarios = correos || record.correo_responsable_ensayo || '';
                enviarNotificacionRechazoEnsayo(destinatarios, {
                    identificador_ensayo: record.solicitud?.identificador_ensayo,
                    nombre_tipo_ensayo: record.tipo_ensayo?.nombre_tipo_ensayo,
                    usuario_aprobacion: record.usuario_aprobacion,
                    observaciones_aprobacion: record.observaciones_aprobacion
                }).catch((err) => console.error('No se pudo enviar notificación de rechazo:', err));
            }

            return res.status(200).json({ data: record, nuevo_codigo_ensayo_categoria_ensayo: nuevoRegistroId });
        } catch (error) {
            handleError(res, error, 'Error approving/rejecting ensayo');
        }
    },

    // Deactivate record (soft delete)
    deactivate: async (req, res) => {
        try {
            const { id } = req.params;
            
            const record = await Ensayo_categoria_ensayo.findByPk(id);
            
            if (!record) {
                return res.status(404).json({ error: 'Record not found' });
            }

            // Soft delete by setting status
            record.estado = 'I';
            await record.save();

            return res.status(200).json({
                message: 'Record deactivated successfully',
                id: id
            });
        } catch (error) {
            handleError(res, error, 'Error deactivating record');
        }
    }
};