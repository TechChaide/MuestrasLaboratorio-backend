const { Familia } = require('../models');
const { handleError } = require('../helpers/error.helper');

module.exports = {
    // Create or update record
    createOrUpdate: async (req, res) => {
        try {
            const {
                codigo_familia,
                nombre_familia,
                mnemonico,
                detalle,
                probetas_minimas,
                estado,
                fecha_modificacion,
                usuario_modificacion
            } = req.body;

            // Validate required fields

            if (codigo_familia == 0 || codigo_familia === undefined) {
                // Create new record
                const newRecord = await Familia.create({
                    nombre_familia: nombre_familia,
                    mnemonico: mnemonico,
                    detalle: detalle,
                    probetas_minimas: probetas_minimas,
                    estado: estado,
                    fecha_modificacion: fecha_modificacion,
                    usuario_modificacion: usuario_modificacion
                });

                const response = await Familia.findByPk(newRecord.codigo_familia);

                return res.status(201).json({
                    data: response,
                    length: 1
                });
            } else {
                // Update existing record
                const record = await Familia.findByPk(codigo_familia);
                
                if (!record) {
                    return res.status(404).json({ error: 'Record not found' });
                }

                // Update fields
                if (nombre_familia !== undefined) record.nombre_familia = nombre_familia;
                if (mnemonico !== undefined) record.mnemonico = mnemonico;
                if (detalle !== undefined) record.detalle = detalle;
                if (probetas_minimas !== undefined) record.probetas_minimas = probetas_minimas;
                if (estado !== undefined) record.estado = estado;
                if (fecha_modificacion !== undefined) record.fecha_modificacion = fecha_modificacion;
                if (usuario_modificacion !== undefined) record.usuario_modificacion = usuario_modificacion;
                
                await record.save();

                const updatedRecord = await Familia.findByPk(codigo_familia);

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

            const { count, rows } = await Familia.findAndCountAll({
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
            
            const record = await Familia.findByPk(id);

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
            
            const record = await Familia.findByPk(id);
            
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