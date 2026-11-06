const { Op } = require('sequelize');
const { Solicitud } = require('../models');
const { handleError } = require('../helpers/error.helper');
const { enviarNotificacionRequerimientoEntrante } = require('../mailer/mailer');
const { getValorConfiguracion } = require('../mailer/configuracion.helper');

module.exports = {
    // Create or update record
    createOrUpdate: async (req, res) => {
        try {
            const {
                codigo_solicitud,
                identificador_ensayo,
                descripcion,
                fecha_fab_adq,
                lote_serial,
                fecha_fabricacion,
                origen_solicitud,
                correos_objetivo,
                aceptacion_terminos,
                estado_solicitud,
                estado,
                fecha_modificacion,
                usuario_mnodificacion
            } = req.body;

            // Validate required fields

            if (codigo_solicitud == 0 || codigo_solicitud === undefined) {
                // Create new record
                const newRecord = await Solicitud.create({
                    identificador_ensayo: identificador_ensayo,
                    descripcion: descripcion,
                    fecha_fab_adq: fecha_fab_adq,
                    lote_serial: lote_serial,
                    fecha_fabricacion: fecha_fabricacion,
                    origen_solicitud: origen_solicitud,
                    correos_objetivo: correos_objetivo,
                    aceptacion_terminos: aceptacion_terminos,
                    estado_solicitud: estado_solicitud,
                    estado: estado,
                    fecha_modificacion: fecha_modificacion,
                    usuario_mnodificacion: usuario_mnodificacion
                });

                const response = await Solicitud.findByPk(newRecord.codigo_solicitud);

                // 2.1 — Nuevo requerimiento de ensayo, aún sin asignar. El correo del
                // encargado se resuelve en vivo desde `configuracion` (ENCARGADO_APLICATIVO,
                // APP_ENSAYOS_LABORATORIO) en seguridadesGuard — best-effort, no bloquea la respuesta.
                getValorConfiguracion('ENCARGADO_APLICATIVO')
                    .then((correo) => {
                        if (!correo) return;
                        return enviarNotificacionRequerimientoEntrante(correo, {
                            identificador_ensayo: response.identificador_ensayo,
                            descripcion: response.descripcion,
                            fecha_fab_adq: response.fecha_fab_adq,
                        });
                    })
                    .catch((err) => console.error('No se pudo enviar notificación de requerimiento entrante:', err));

                return res.status(201).json({
                    data: response,
                    length: 1
                });
            } else {
                // Update existing record
                const record = await Solicitud.findByPk(codigo_solicitud);
                
                if (!record) {
                    return res.status(404).json({ error: 'Record not found' });
                }

                // Update fields
                if (identificador_ensayo !== undefined) record.identificador_ensayo = identificador_ensayo;
                if (descripcion !== undefined) record.descripcion = descripcion;
                if (fecha_fab_adq !== undefined) record.fecha_fab_adq = fecha_fab_adq;
                if (lote_serial !== undefined) record.lote_serial = lote_serial;
                if (fecha_fabricacion !== undefined) record.fecha_fabricacion = fecha_fabricacion;
                if (origen_solicitud !== undefined) record.origen_solicitud = origen_solicitud;
                if (correos_objetivo !== undefined) record.correos_objetivo = correos_objetivo;
                if (aceptacion_terminos !== undefined) record.aceptacion_terminos = aceptacion_terminos;
                if (estado_solicitud !== undefined) record.estado_solicitud = estado_solicitud;
                if (estado !== undefined) record.estado = estado;
                if (fecha_modificacion !== undefined) record.fecha_modificacion = fecha_modificacion;
                if (usuario_mnodificacion !== undefined) record.usuario_mnodificacion = usuario_mnodificacion;
                
                await record.save();

                const updatedRecord = await Solicitud.findByPk(codigo_solicitud);

                return res.status(200).json({
                    data: updatedRecord,
                    length: 1
                });
            }
        } catch (error) {
            handleError(res, error, 'Error creating or updating record');
        }
    },

    // Último número de secuencia usado por una familia en el mes/año dados —
    // el identificador se arma como FAMILIA-MES-AA-### y la secuencia se
    // reinicia cada mes, así que se busca el máximo sufijo numérico entre los
    // identificadores que ya llevan ese mismo prefijo (familia+mes+año).
    getUltimaSolicitud: async (req, res) => {
        try {
            const { mnemonicoFamilia, mes, anio } = req.body;

            if (!mnemonicoFamilia || !mes || !anio) {
                return res.status(400).json({ error: 'mnemonicoFamilia, mes y anio son requeridos' });
            }

            const prefijo = `${String(mnemonicoFamilia).trim().toUpperCase()}-${String(mes).trim().toUpperCase()}-${String(anio).trim()}-`;

            const registros = await Solicitud.findAll({
                where: { identificador_ensayo: { [Op.like]: `${prefijo}%` } },
                attributes: ['identificador_ensayo'],
            });

            let ultimoNumero = 0;
            for (const r of registros) {
                const match = /(\d+)$/.exec(r.identificador_ensayo || '');
                if (match) {
                    const n = parseInt(match[1], 10);
                    if (n > ultimoNumero) ultimoNumero = n;
                }
            }

            return res.status(200).json({
                data: { ultimo_numero_ensayo: ultimoNumero },
                length: 1
            });
        } catch (error) {
            handleError(res, error, 'Error fetching last solicitud sequence for familia');
        }
    },

    // Get all records
    getAll: async (req, res) => {
        try {
            const { page = 1, limit = 10000 } = req.query;
            const offset = (page - 1) * limit;

            const { count, rows } = await Solicitud.findAndCountAll({
                limit: parseInt(limit),
                offset: parseInt(offset),
                where: { estado: 'A' }
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
            
            const record = await Solicitud.findByPk(id);

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

    // Deactivate record (soft delete)
    deactivate: async (req, res) => {
        try {
            const { id } = req.params;
            
            const record = await Solicitud.findByPk(id);
            
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