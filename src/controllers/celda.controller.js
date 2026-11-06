const { Celda, Columna, Tabla } = require('../models');
const { handleError } = require('../helpers/error.helper');
const { where } = require('sequelize');

// Tipos de dato controlados para el valor que se captura en una celda.
const TIPOS_DATO_VALIDOS = ['entero', 'double', 'fecha', 'texto', 'booleano', 'nulos', 'imagen'];
const TIPO_DATO_DEFECTO = 'texto';

module.exports = {
    // Create or update record
    createOrUpdate: async (req, res) => {
        try {
            const {
                codigo_celda,
                codigo_tabla,
                codigo_columna,
                fila,
                col,
                rowspan,
                colspan,
                tipo_celda,
                tipo_dato,
                alias,
                campo_obligatorio,
                estado,
                fecha_modificacion,
                usuario_modificacion
            } = req.body;

            // Validate required fields

            if (tipo_dato !== undefined && tipo_dato !== null && !TIPOS_DATO_VALIDOS.includes(tipo_dato)) {
                return res.status(400).json({
                    error: `tipo_dato inválido. Valores permitidos: ${TIPOS_DATO_VALIDOS.join(', ')}`
                });
            }

            if (codigo_celda == 0 || codigo_celda === undefined) {
                // Create new record
                const newRecord = await Celda.create({
                    codigo_tabla: codigo_tabla,
                    codigo_columna: codigo_columna,
                    fila: fila,
                    col: col,
                    rowspan: rowspan,
                    colspan: colspan,
                    tipo_celda: tipo_celda,
                    tipo_dato: tipo_dato || TIPO_DATO_DEFECTO,
                    alias: alias,
                    campo_obligatorio: campo_obligatorio,
                    estado: estado,
                    fecha_modificacion: fecha_modificacion,
                    usuario_modificacion: usuario_modificacion
                });

                const response = await Celda.findByPk(newRecord.codigo_celda, {
                    include: [
                        { model: Columna, as: 'columna' },
                        { model: Tabla, as: 'tabla' }
                    ]
                });

                return res.status(201).json({
                    data: response,
                    length: 1
                });
            } else {
                // Update existing record
                const record = await Celda.findByPk(codigo_celda, {
                    include: [
                        { model: Columna, as: 'columna' },
                        { model: Tabla, as: 'tabla' }
                    ]
                });
                
                if (!record) {
                    return res.status(404).json({ error: 'Record not found' });
                }

                // Update fields
                if (codigo_tabla !== undefined) record.codigo_tabla = codigo_tabla;
                if (codigo_columna !== undefined) record.codigo_columna = codigo_columna;
                if (fila !== undefined) record.fila = fila;
                if (col !== undefined) record.col = col;
                if (rowspan !== undefined) record.rowspan = rowspan;
                if (colspan !== undefined) record.colspan = colspan;
                if (tipo_celda !== undefined) record.tipo_celda = tipo_celda;
                if (tipo_dato !== undefined) record.tipo_dato = tipo_dato;
                if (alias !== undefined) record.alias = alias;
                if (campo_obligatorio !== undefined) record.campo_obligatorio = campo_obligatorio;
                if (estado !== undefined) record.estado = estado;
                if (fecha_modificacion !== undefined) record.fecha_modificacion = fecha_modificacion;
                if (usuario_modificacion !== undefined) record.usuario_modificacion = usuario_modificacion;
                
                await record.save();

                const updatedRecord = await Celda.findByPk(codigo_celda, {
                    include: [
                        { model: Columna, as: 'columna' },
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

            // No filtrar Tabla.estado: las celdas de una versión inactiva deben
            // seguir cargándose para mostrar resultados ya capturados.
            const { count, rows } = await Celda.findAndCountAll({
                limit: parseInt(limit),
                offset: parseInt(offset),
                where: { estado: 'A' },
                include: [
                    { model: Columna, as: 'columna', required: false },
                    { model: Tabla, as: 'tabla', required: false }
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

    // GET /api/celda/por-tabla?codigo_tabla=77
    getByTabla: async (req, res) => {
        try {
            const codigoTabla = Number(req.query.codigo_tabla);
            if (!Number.isInteger(codigoTabla) || codigoTabla <= 0) {
                return res.status(400).json({ error: 'codigo_tabla es requerido' });
            }
            const rows = await Celda.findAll({
                where: { estado: 'A', codigo_tabla: codigoTabla },
                include: [
                    { model: Columna, as: 'columna', required: false },
                    { model: Tabla, as: 'tabla', required: false },
                ],
            });
            return res.status(200).json({ data: rows, length: rows.length, total: rows.length });
        } catch (error) {
            handleError(res, error, 'Error fetching celdas por tabla');
        }
    },

    // Get record by ID
    getById: async (req, res) => {
        try {
            const { id } = req.params;
            
            const record = await Celda.findByPk(id, {
                include: [
                    { model: Columna, as: 'columna' },
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
            
            const record = await Celda.findByPk(id);
            
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