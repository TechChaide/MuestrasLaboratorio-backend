const { Formulario_tabla, Formulario, Tabla } = require('../models');
const { handleError } = require('../helpers/error.helper');

module.exports = {
    // Create or update record
    createOrUpdate: async (req, res) => {
        try {
            const {
                codigo_formulario_tabla,
                codigo_formulario,
                codigo_tabla,
                cabecera_formulario,
                posicion,
                estado,
                fecha_modificacion,
                usuario_modificacion
            } = req.body;

            // Validate required fields

            if (codigo_formulario_tabla == 0 || codigo_formulario_tabla === undefined) {
                // Create new record
                const newRecord = await Formulario_tabla.create({
                    codigo_formulario: codigo_formulario,
                    codigo_tabla: codigo_tabla,
                    cabecera_formulario: cabecera_formulario,
                    posicion: posicion,
                    estado: estado,
                    fecha_modificacion: fecha_modificacion,
                    usuario_modificacion: usuario_modificacion
                });

                const response = await Formulario_tabla.findByPk(newRecord.codigo_formulario_tabla, {
                    include: [
                        { model: Formulario, as: 'formulario' },
                        { model: Tabla, as: 'tabla' }
                    ]
                });

                return res.status(201).json({
                    data: response,
                    length: 1
                });
            } else {
                // Update existing record
                const record = await Formulario_tabla.findByPk(codigo_formulario_tabla, {
                    include: [
                        { model: Formulario, as: 'formulario' },
                        { model: Tabla, as: 'tabla' }
                    ]
                });
                
                if (!record) {
                    return res.status(404).json({ error: 'Record not found' });
                }

                // Update fields
                if (codigo_formulario !== undefined) record.codigo_formulario = codigo_formulario;
                if (codigo_tabla !== undefined) record.codigo_tabla = codigo_tabla;
                if (cabecera_formulario !== undefined) record.cabecera_formulario = cabecera_formulario;
                if (posicion !== undefined) record.posicion = posicion;
                if (estado !== undefined) record.estado = estado;
                if (fecha_modificacion !== undefined) record.fecha_modificacion = fecha_modificacion;
                if (usuario_modificacion !== undefined) record.usuario_modificacion = usuario_modificacion;
                
                await record.save();

                const updatedRecord = await Formulario_tabla.findByPk(codigo_formulario_tabla, {
                    include: [
                        { model: Formulario, as: 'formulario' },
                        { model: Tabla, as: 'tabla' }
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

            const { count, rows } = await Formulario_tabla.findAndCountAll({
                limit: parseInt(limit),
                offset: parseInt(offset),
                where: { estado: 'A' },
                include: [
                    { model: Formulario, as: 'formulario', where: { estado: 'A' } },
                    { model: Tabla, as: 'tabla', where: { estado: 'A' } }
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
            
            const record = await Formulario_tabla.findByPk(id, {
                include: [
                    { model: Formulario, as: 'formulario' },
                    { model: Tabla, as: 'tabla' }
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
            
            const record = await Formulario_tabla.findByPk(id);
            
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