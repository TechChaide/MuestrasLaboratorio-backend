const { Tabla, Tipo_ensayo } = require('../models');
const { handleError } = require('../helpers/error.helper');

module.exports = {
    // Create or update record
    createOrUpdate: async (req, res) => {
        try {
            const {
                codigo_tabla,
                codigo_tipo_ensayo,
                nombre_tabla,
                filas_muestra,
                numero_columnas,
                numero_filas_diseno,
                version,
                tipo_tabla,
                estado,
                fecha_modificacion,
                usuario_modificacion
            } = req.body;

            // Validate required fields

            if (codigo_tabla == 0 || codigo_tabla === undefined) {
                // Create new record
                const newRecord = await Tabla.create({
                    codigo_tipo_ensayo: codigo_tipo_ensayo,
                    nombre_tabla: nombre_tabla,
                    filas_muestra: filas_muestra,
                    numero_columnas: numero_columnas,
                    numero_filas_diseno: numero_filas_diseno,
                    version: version,
                    tipo_tabla: tipo_tabla,
                    estado: estado,
                    fecha_modificacion: fecha_modificacion,
                    usuario_modificacion: usuario_modificacion
                });

                const response = await Tabla.findByPk(newRecord.codigo_tabla, {
                    include: [
                        { model: Tipo_ensayo, as: 'tipo_ensayo' }
                    ]
                });

                return res.status(201).json({
                    data: response,
                    length: 1
                });
            } else {
                // Update existing record
                const record = await Tabla.findByPk(codigo_tabla, {
                    include: [
                        { model: Tipo_ensayo, as: 'tipo_ensayo' }
                    ]
                });
                
                if (!record) {
                    return res.status(404).json({ error: 'Record not found' });
                }

                // Update fields
                if (codigo_tipo_ensayo !== undefined) record.codigo_tipo_ensayo = codigo_tipo_ensayo;
                if (nombre_tabla !== undefined) record.nombre_tabla = nombre_tabla;
                if (filas_muestra !== undefined) record.filas_muestra = filas_muestra;
                if (numero_columnas !== undefined) record.numero_columnas = numero_columnas;
                if (numero_filas_diseno !== undefined) record.numero_filas_diseno = numero_filas_diseno;
                if (version !== undefined) record.version = version;
                if (tipo_tabla === undefined) record.tipo_tabla = tipo_tabla;
                if (estado !== undefined) record.estado = estado;
                if (fecha_modificacion !== undefined) record.fecha_modificacion = fecha_modificacion;
                if (usuario_modificacion !== undefined) record.usuario_modificacion = usuario_modificacion;
                
                await record.save();

                const updatedRecord = await Tabla.findByPk(codigo_tabla, {
                    include: [
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

            const { count, rows } = await Tabla.findAndCountAll({
                limit: parseInt(limit),
                offset: parseInt(offset),
                include: [
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
            
            const record = await Tabla.findByPk(id, {
                include: [
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
            
            const record = await Tabla.findByPk(id);
            
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