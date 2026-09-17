const { Resultado, Celda, Ensayo_categoria_ensayo } = require('../models');
const { handleError } = require('../helpers/error.helper');

module.exports = {
    // Create or update record
    createOrUpdate: async (req, res) => {
        try {
            const {
                codigo_resultado,
                codigo_ensayo_categoria_ensayo,
                codigo_celda,
                fecha_generacion,
                toma,
                valor,
                resultados,
                estado,
                fecha_creacion,
                usuario_creacion
            } = req.body;

            // Validate required fields

            if (codigo_resultado == 0 || codigo_resultado === undefined) {
                // Create new record
                const newRecord = await Resultado.create({
                    codigo_ensayo_categoria_ensayo: codigo_ensayo_categoria_ensayo,
                    codigo_celda: codigo_celda,
                    fecha_generacion: fecha_generacion,
                    toma: toma,
                    valor: valor,
                    resultados: resultados,
                    estado: estado,
                    fecha_creacion: fecha_creacion,
                    usuario_creacion: usuario_creacion
                });

                const response = await Resultado.findByPk(newRecord.codigo_resultado, {
                    include: [
                        { model: Celda, as: 'celda' },
                        { model: Ensayo_categoria_ensayo, as: 'ensayo_categoria_ensayo' }
                    ]
                });

                return res.status(201).json({
                    data: response,
                    length: 1
                });
            } else {
                // Update existing record
                const record = await Resultado.findByPk(codigo_resultado, {
                    include: [
                        { model: Celda, as: 'celda' },
                        { model: Ensayo_categoria_ensayo, as: 'ensayo_categoria_ensayo' }
                    ]
                });
                
                if (!record) {
                    return res.status(404).json({ error: 'Record not found' });
                }

                // Update fields
                if (codigo_ensayo_categoria_ensayo !== undefined) record.codigo_ensayo_categoria_ensayo = codigo_ensayo_categoria_ensayo;
                if (codigo_celda !== undefined) record.codigo_celda = codigo_celda;
                if (fecha_generacion !== undefined) record.fecha_generacion = fecha_generacion;
                if (toma !== undefined) record.toma = toma;
                if (valor !== undefined) record.valor = valor;
                if (resultados !== undefined) record.resultados = resultados;
                if (estado !== undefined) record.estado = estado;
                if (fecha_creacion !== undefined) record.fecha_creacion = fecha_creacion;
                if (usuario_creacion !== undefined) record.usuario_creacion = usuario_creacion;
                
                await record.save();

                const updatedRecord = await Resultado.findByPk(codigo_resultado, {
                    include: [
                        { model: Celda, as: 'celda' },
                        { model: Ensayo_categoria_ensayo, as: 'ensayo_categoria_ensayo' }
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

            const { count, rows } = await Resultado.findAndCountAll({
                limit: parseInt(limit),
                offset: parseInt(offset),
                where: { estado: 'A' },
                include: [
                    { model: Celda, as: 'celda', where: { estado: 'A' } },
                    { model: Ensayo_categoria_ensayo, as: 'ensayo_categoria_ensayo', where: { estado: 'A' } }
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
            
            const record = await Resultado.findByPk(id, {
                include: [
                    { model: Celda, as: 'celda' },
                    { model: Ensayo_categoria_ensayo, as: 'ensayo_categoria_ensayo' }
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
            
            const record = await Resultado.findByPk(id);
            
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