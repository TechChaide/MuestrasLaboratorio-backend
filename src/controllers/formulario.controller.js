const { Op } = require('sequelize');
const { Formulario, Formulario_tabla, Tabla, Resultado, Celda } = require('../models');
const { handleError } = require('../helpers/error.helper');

function linajeTablaKey(tabla) {
    if (!tabla) return '';
    return `${tabla.codigo_tipo_ensayo ?? ''}::${String(tabla.nombre_tabla || '').trim().toLowerCase()}`;
}

function versionTabla(tabla) {
    const n = Number.parseInt(String(tabla?.version ?? '0'), 10);
    return Number.isFinite(n) ? n : 0;
}

/** Si el ensayo ya capturó resultados en una versión anterior del mismo
 * nombre y tipo, esa versión gana. Sin datos, se queda la tabla del formulario. */
function elegirVersionCapturada(vinculada, candidatas, totalPorTabla) {
    const conDatos = candidatas.filter((t) => (totalPorTabla.get(Number(t.codigo_tabla)) || 0) > 0);
    if (conDatos.length === 0) return vinculada;
    conDatos.sort((a, b) => {
        const da = totalPorTabla.get(Number(a.codigo_tabla)) || 0;
        const db = totalPorTabla.get(Number(b.codigo_tabla)) || 0;
        if (db !== da) return db - da;
        if (versionTabla(b) !== versionTabla(a)) return versionTabla(b) - versionTabla(a);
        return Number(b.codigo_tabla) - Number(a.codigo_tabla);
    });
    return conDatos[0];
}

module.exports = {
    // Create or update record
    createOrUpdate: async (req, res) => {
        try {
            const {
                codigo_formulario,
                nombre_formulario,
                version_formulario,
                estado,
                fecha_modificacion,
                usuario_modificacion
            } = req.body;

            // Validate required fields
            if (codigo_formulario === undefined || codigo_formulario === null) {
                return res.status(400).json({ 
                    error: 'Missing required fields',
                    details: {
                        codigo_formulario: codigo_formulario === undefined ? 'undefined' : codigo_formulario === null ? 'null' : 'present'
                    }
                });
            }

            if (codigo_formulario == 0 || codigo_formulario === undefined) {
                // Create new record
                const newRecord = await Formulario.create({
                    nombre_formulario: nombre_formulario,
                    version_formulario: version_formulario,
                    estado: estado,
                    fecha_modificacion: fecha_modificacion,
                    usuario_modificacion: usuario_modificacion
                });

                const response = await Formulario.findByPk(newRecord.codigo_formulario);

                return res.status(201).json({
                    data: response,
                    length: 1
                });
            } else {
                // Update existing record
                const record = await Formulario.findByPk(codigo_formulario);
                
                if (!record) {
                    return res.status(404).json({ error: 'Record not found' });
                }

                // Update fields
                if (nombre_formulario !== undefined) record.nombre_formulario = nombre_formulario;
                if (version_formulario !== undefined) record.version_formulario = version_formulario;
                if (estado !== undefined) record.estado = estado;
                if (fecha_modificacion !== undefined) record.fecha_modificacion = fecha_modificacion;
                if (usuario_modificacion !== undefined) record.usuario_modificacion = usuario_modificacion;
                
                await record.save();

                const updatedRecord = await Formulario.findByPk(codigo_formulario);

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

            const { count, rows } = await Formulario.findAndCountAll({
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
            
            const record = await Formulario.findByPk(id);

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

    // Tablas de las secciones del formulario, en orden.
    // GET /api/formulario/:id/tablas
    // GET /api/formulario/:id/tablas?codigo_ensayo_categoria_ensayo=123
    // Con el ensayo: si los resultados quedaron en una versión anterior de la
    // misma tabla (mismo nombre y tipo), se devuelve esa versión, no la última
    // que el formulario tenga enlazada.
    getTablas: async (req, res) => {
        try {
            const codigo = Number(req.params.id);
            if (!Number.isInteger(codigo) || codigo <= 0) {
                return res.status(400).json({ error: 'codigo_formulario inválido' });
            }

            const formulario = await Formulario.findByPk(codigo);
            if (!formulario) {
                return res.status(404).json({ error: 'Record not found', id: codigo });
            }

            const rows = await Formulario_tabla.findAll({
                where: {
                    codigo_formulario: codigo,
                    [Op.or]: [
                        { estado: { [Op.ne]: 'I' } },
                        { estado: null },
                    ],
                },
                include: [
                    { model: Tabla, as: 'tabla', required: false },
                ],
            });

            rows.sort((a, b) => (Number(a.posicion) || 0) - (Number(b.posicion) || 0));

            const codigoEnsayo = Number(req.query.codigo_ensayo_categoria_ensayo);
            const resolverVersion = Number.isInteger(codigoEnsayo) && codigoEnsayo > 0;
            let totalPorTabla = new Map();
            let hermanas = [];

            if (resolverVersion) {
                const vinculadas = rows.map((r) => r.tabla).filter((t) => t && t.codigo_tabla);
                const tipos = [...new Set(vinculadas.map((t) => t.codigo_tipo_ensayo).filter((v) => v != null))];
                const nombres = [...new Set(vinculadas.map((t) => t.nombre_tabla).filter(Boolean))];
                const whereLinaje = [];
                if (tipos.length) whereLinaje.push({ codigo_tipo_ensayo: { [Op.in]: tipos } });
                if (nombres.length) whereLinaje.push({ nombre_tabla: { [Op.in]: nombres } });

                const [resultados, tablasLinaje] = await Promise.all([
                    Resultado.findAll({
                        where: { estado: 'A', codigo_ensayo_categoria_ensayo: codigoEnsayo },
                        attributes: ['codigo_resultado', 'codigo_celda'],
                        include: [{
                            model: Celda,
                            as: 'celda',
                            required: true,
                            attributes: ['codigo_celda', 'codigo_tabla'],
                        }],
                    }),
                    whereLinaje.length
                        ? Tabla.findAll({ where: { [Op.or]: whereLinaje } })
                        : Promise.resolve([]),
                ]);

                for (const resultado of resultados) {
                    const idTabla = Number(resultado.celda && resultado.celda.codigo_tabla);
                    if (!idTabla) continue;
                    totalPorTabla.set(idTabla, (totalPorTabla.get(idTabla) || 0) + 1);
                }
                hermanas = tablasLinaje;
            }

            const data = rows.map((row) => {
                const plain = row.get({ plain: true });
                const vinculada = plain.tabla;
                if (!resolverVersion || !vinculada || !vinculada.codigo_tabla) return plain;

                const key = linajeTablaKey(vinculada);
                const candidatas = hermanas.filter((t) => linajeTablaKey(t) === key);
                if (!candidatas.some((t) => Number(t.codigo_tabla) === Number(vinculada.codigo_tabla))) {
                    candidatas.push(vinculada);
                }
                const elegida = elegirVersionCapturada(vinculada, candidatas, totalPorTabla);
                if (!elegida || Number(elegida.codigo_tabla) === Number(vinculada.codigo_tabla)) return plain;

                const tablaPlana = typeof elegida.get === 'function' ? elegida.get({ plain: true }) : elegida;
                return {
                    ...plain,
                    codigo_tabla: tablaPlana.codigo_tabla,
                    tabla: tablaPlana,
                };
            });

            return res.status(200).json({
                data,
                length: data.length,
            });
        } catch (error) {
            handleError(res, error, 'Error fetching tablas del formulario');
        }
    },

    // Deactivate record (soft delete)
    deactivate: async (req, res) => {
        try {
            const { id } = req.params;
            
            const record = await Formulario.findByPk(id);
            
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