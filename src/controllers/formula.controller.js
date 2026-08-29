const { Formula, Celda } = require('../models');
const { handleError } = require('../helpers/error.helper');

module.exports = {
    // Create or update record
    createOrUpdate: async (req, res) => {
        try {
            const {
                codigo_formula,
                codigo_celda,
                nombre,
                expresion,
                latex,
                ambito,
                estado,
                fecha_modificacion,
                usuario_modificacion
            } = req.body;

            // Validate required fields
            if (codigo_formula === undefined || codigo_formula === null) {
                return res.status(400).json({ 
                    error: 'Missing required fields',
                    details: {
                        codigo_formula: codigo_formula === undefined ? 'undefined' : codigo_formula === null ? 'null' : 'present'
                    }
                });
            }

            if (codigo_formula == 0) {
                // Create new record
                const newRecord = await Formula.create({
                    codigo_celda: codigo_celda,
                    nombre: nombre,
                    expresion: expresion,
                    latex: latex,
                    ambito: ambito,
                    estado: estado,
                    fecha_modificacion: fecha_modificacion,
                    usuario_modificacion: usuario_modificacion
                });

                const response = await Formula.findByPk(newRecord.codigo_formula, {
                    include: [
                        { model: Celda, as: 'celda' }
                    ]
                });

                return res.status(201).json({
                    data: response,
                    length: 1
                });
            } else {
                // Update existing record
                const record = await Formula.findByPk(codigo_formula, {
                    include: [
                        { model: Celda, as: 'celda' }
                    ]
                });
                
                if (!record) {
                    return res.status(404).json({ error: 'Record not found' });
                }

                // Update fields
                if (codigo_celda !== undefined) record.codigo_celda = codigo_celda;
                if (nombre !== undefined) record.nombre = nombre;
                if (expresion !== undefined) record.expresion = expresion;
                if (latex !== undefined) record.latex = latex;
                if (ambito !== undefined) record.ambito = ambito;
                if (estado !== undefined) record.estado = estado;
                if (fecha_modificacion !== undefined) record.fecha_modificacion = fecha_modificacion;
                if (usuario_modificacion !== undefined) record.usuario_modificacion = usuario_modificacion;
                
                await record.save();

                const updatedRecord = await Formula.findByPk(codigo_formula, {
                    include: [
                        { model: Celda, as: 'celda' }
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

            const { count, rows } = await Formula.findAndCountAll({
                limit: parseInt(limit),
                offset: parseInt(offset),
                include: [
                    { model: Celda, as: 'celda' }
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
            
            const record = await Formula.findByPk(id, {
                include: [
                    { model: Celda, as: 'celda' }
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
            
            const record = await Formula.findByPk(id);
            
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