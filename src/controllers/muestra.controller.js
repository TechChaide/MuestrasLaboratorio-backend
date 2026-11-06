const { Muestra } = require('../models');
const { handleError } = require('../helpers/error.helper');

module.exports = {
    // Create or update record
    createOrUpdate: async (req, res) => {
        try {
            const {
                codigo_muestra,
                codigo_familia_material,
                nombre_material_muestra,
                area_material,
                detalle_material,
                material,
                fecha_carga,
                estado,
                fecha_creacion,
                usuario_creacion
            } = req.body;

            // Validate required fields
            if (nombre_material_muestra === undefined || nombre_material_muestra === null) {
                return res.status(400).json({ 
                    error: 'Missing required fields',
                    details: {
                        nombre_material_muestra: nombre_material_muestra === undefined ? 'undefined' : nombre_material_muestra === null ? 'null' : 'present'
                    }
                });
            }

            if (codigo_muestra == 0 || codigo_muestra === undefined) {
                // Create new record
                const newRecord = await Muestra.create({
                    codigo_familia_material: codigo_familia_material,
                    nombre_material_muestra: nombre_material_muestra,
                    area_material: area_material,
                    detalle_material: detalle_material,
                    material: material,
                    fecha_carga: fecha_carga,
                    estado: estado,
                    fecha_creacion: fecha_creacion,
                    usuario_creacion: usuario_creacion
                });

                const response = await Muestra.findByPk(newRecord.codigo_muestra);

                return res.status(201).json({
                    data: response,
                    length: 1
                });
            } else {
                // Update existing record
                const record = await Muestra.findByPk(codigo_muestra);
                
                if (!record) {
                    return res.status(404).json({ error: 'Record not found' });
                }

                // Update fields
                if (codigo_familia_material !== undefined) record.codigo_familia_material = codigo_familia_material;
                if (nombre_material_muestra !== undefined) record.nombre_material_muestra = nombre_material_muestra;
                if (area_material !== undefined) record.area_material = area_material;
                if (detalle_material !== undefined) record.detalle_material = detalle_material;
                if (material !== undefined) record.material = material;
                if (fecha_carga !== undefined) record.fecha_carga = fecha_carga;
                if (estado !== undefined) record.estado = estado;
                if (fecha_creacion !== undefined) record.fecha_creacion = fecha_creacion;
                if (usuario_creacion !== undefined) record.usuario_creacion = usuario_creacion;
                
                await record.save();

                const updatedRecord = await Muestra.findByPk(codigo_muestra);

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

            const { count, rows } = await Muestra.findAndCountAll({
                limit: parseInt(limit),
                offset: parseInt(offset),
                where: { estado: 'A' },
                include: [{
                    association: 'ensayosCategoriaEnsayo',
                    attributes: ['codigo_ensayo_categoria_ensayo', 'codigo_solicitud'],
                    include: [{
                        association: 'solicitud',
                        attributes: ['codigo_solicitud', 'identificador_ensayo']
                    }]
                }]
            });

            // Aplana las solicitudes asignadas (vía ensayo_categoria_ensayo) a un
            // solo campo por muestra, para que el listado de administración de
            // muestras pueda mostrar el/los identificador(es) sin que el frontend
            // tenga que recorrer la relación anidada.
            const data = rows.map((row) => {
                const plain = row.toJSON();
                const identificadores = Array.from(new Set(
                    (plain.ensayosCategoriaEnsayo || [])
                        .map((e) => e.solicitud?.identificador_ensayo)
                        .filter(Boolean)
                ));
                delete plain.ensayosCategoriaEnsayo;
                return { ...plain, identificadores_ensayo: identificadores };
            });

            return res.status(200).json({
                data,
                length: data.length,
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
            
            const record = await Muestra.findByPk(id);

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
            
            const record = await Muestra.findByPk(id);
            
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