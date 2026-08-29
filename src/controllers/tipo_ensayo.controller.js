const { Tipo_ensayo, Familia } = require('../models');
const { handleError } = require('../helpers/error.helper');

module.exports = {
    // Create or update record
    createOrUpdate: async (req, res) => {
        try {
            const {
                codigo_tipo_ensayo,
                codigo_familia,
                nombre_tipo_ensayo,
                mnemonico,
                estado,
                fecha_creacion,
                usuario_creacion
            } = req.body;

            // Validate required fields

            if (codigo_tipo_ensayo == 0 || codigo_tipo_ensayo === undefined) {
                // Create new record
                const newRecord = await Tipo_ensayo.create({
                    codigo_familia: codigo_familia,
                    nombre_tipo_ensayo: nombre_tipo_ensayo,
                    mnemonico: mnemonico,
                    estado: estado,
                    fecha_creacion: fecha_creacion,
                    usuario_creacion: usuario_creacion
                });

                const response = await Tipo_ensayo.findByPk(newRecord.codigo_tipo_ensayo, {
                    include: [
                        { model: Familia, as: 'familia' }
                    ]
                });

                return res.status(201).json({
                    data: response,
                    length: 1
                });
            } else {
                // Update existing record
                const record = await Tipo_ensayo.findByPk(codigo_tipo_ensayo, {
                    include: [
                        { model: Familia, as: 'familia' }
                    ]
                });
                
                if (!record) {
                    return res.status(404).json({ error: 'Record not found' });
                }

                // Update fields
                if (codigo_familia !== undefined) record.codigo_familia = codigo_familia;
                if (nombre_tipo_ensayo !== undefined) record.nombre_tipo_ensayo = nombre_tipo_ensayo;
                if (mnemonico !== undefined) record.mnemonico = mnemonico;
                if (estado !== undefined) record.estado = estado;
                if (fecha_creacion !== undefined) record.fecha_creacion = fecha_creacion;
                if (usuario_creacion !== undefined) record.usuario_creacion = usuario_creacion;
                
                await record.save();

                const updatedRecord = await Tipo_ensayo.findByPk(codigo_tipo_ensayo, {
                    include: [
                        { model: Familia, as: 'familia' }
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

            const { count, rows } = await Tipo_ensayo.findAndCountAll({
                limit: parseInt(limit),
                offset: parseInt(offset),
                include: [
                    { model: Familia, as: 'familia' }
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
            
            const record = await Tipo_ensayo.findByPk(id, {
                include: [
                    { model: Familia, as: 'familia' }
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

    // Deactivate record (soft delete)
    deactivate: async (req, res) => {
        try {
            const { id } = req.params;
            
            const record = await Tipo_ensayo.findByPk(id);
            
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