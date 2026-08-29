const { Solicitud } = require('../models');
const { handleError } = require('../helpers/error.helper');

module.exports = {
    // Create or update record
    createOrUpdate: async (req, res) => {
        try {
            const {
                codigo_solicitud,
                identificador_ensayo,
                descripcion,
                fecha_fab_adq,
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
                    correos_objetivo: correos_objetivo,
                    aceptacion_terminos: aceptacion_terminos,
                    estado_solicitud: estado_solicitud,
                    estado: estado,
                    fecha_modificacion: fecha_modificacion,
                    usuario_mnodificacion: usuario_mnodificacion
                });

                const response = await Solicitud.findByPk(newRecord.codigo_solicitud);

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

    // Get all records
    getAll: async (req, res) => {
        try {
            const { page = 1, limit = 10000 } = req.query;
            const offset = (page - 1) * limit;

            const { count, rows } = await Solicitud.findAndCountAll({
                limit: parseInt(limit),
                offset: parseInt(offset)
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