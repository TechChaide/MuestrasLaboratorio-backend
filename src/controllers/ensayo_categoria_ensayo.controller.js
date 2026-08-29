const { Ensayo_categoria_ensayo, Solicitud, Formulario, Muestra, Tipo_ensayo } = require('../models');
const { handleError } = require('../helpers/error.helper');

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
                fecha_inicio,
                fecha_fin,
                fecha_extension,
                estado,
                fecha_creacion,
                usuario_creacion
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
                    fecha_inicio: fecha_inicio,
                    fecha_fin: fecha_fin,
                    fecha_extension: fecha_extension,
                    estado: estado,
                    fecha_creacion: fecha_creacion,
                    usuario_creacion: usuario_creacion
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

                // Update fields
                if (codigo_solicitud !== undefined) record.codigo_solicitud = codigo_solicitud;
                if (codigo_muestra !== undefined) record.codigo_muestra = codigo_muestra;
                if (codigo_tipo_ensayo !== undefined) record.codigo_tipo_ensayo = codigo_tipo_ensayo;
                if (codigo_formulario !== undefined) record.codigo_formulario = codigo_formulario;
                if (responsable_ensayo !== undefined) record.responsable_ensayo = responsable_ensayo;
                if (fecha_inicio !== undefined) record.fecha_inicio = fecha_inicio;
                if (fecha_fin !== undefined) record.fecha_fin = fecha_fin;
                if (fecha_extension !== undefined) record.fecha_extension = fecha_extension;
                if (estado !== undefined) record.estado = estado;
                if (fecha_creacion !== undefined) record.fecha_creacion = fecha_creacion;
                if (usuario_creacion !== undefined) record.usuario_creacion = usuario_creacion;
                
                await record.save();

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
                include: [
                    { model: Formulario, as: 'formulario' },
                    { model: Muestra, as: 'muestra' },
                    { model: Solicitud, as: 'solicitud' },
                    { model: Tipo_ensayo, as: 'tipo_ensayo' }
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