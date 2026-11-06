const { Op } = require('sequelize');
const {
    sequelize,
    Tabla,
    Tipo_ensayo,
    Columna,
    Celda,
    Formula,
    Dependencias,
    Formulario_tabla,
    Formulario,
    Ensayo_categoria_ensayo,
    Resultado,
} = require('../models');
const { handleError } = require('../helpers/error.helper');

/** Formularios ACTIVOS que aún referencian esta tabla, y los ensayos (instancias
 * de Ensayo_categoria_ensayo) que a su vez dependen de esos formularios. Todo
 * resuelto en el servidor con consultas puntuales (where + IN), sin traer al
 * cliente el universo completo de formulario_tabla / formularios / ensayos. */
async function resolveDependenciasTabla(codigoTabla) {
    const links = await Formulario_tabla.findAll({
        where: { codigo_tabla: codigoTabla, estado: 'A' },
        include: [{ model: Formulario, as: 'formulario' }],
    });

    const formularioIds = [...new Set(links.map((l) => l.codigo_formulario).filter(Boolean))];

    const ensayos = formularioIds.length
        ? await Ensayo_categoria_ensayo.findAll({
              where: { codigo_formulario: { [Op.in]: formularioIds }, estado: 'A' },
              include: [{ model: Tipo_ensayo, as: 'tipo_ensayo' }],
          })
        : [];

    const celdas = await Celda.findAll({
        where: { codigo_tabla: codigoTabla },
        attributes: ['codigo_celda'],
    });
    const celdaIds = celdas.map((c) => c.codigo_celda);

    const totalResultadosCapturados = celdaIds.length
        ? await Resultado.count({ where: { codigo_celda: { [Op.in]: celdaIds }, estado: 'A' } })
        : 0;

    return {
        codigo_tabla: codigoTabla,
        en_uso: formularioIds.length > 0,
        formularios: links.map((l) => ({
            codigo_formulario: l.codigo_formulario,
            nombre_formulario: l.formulario?.nombre_formulario,
            cabecera_formulario: l.cabecera_formulario,
        })),
        ensayos: ensayos.map((e) => ({
            codigo_ensayo_categoria_ensayo: e.codigo_ensayo_categoria_ensayo,
            codigo_tipo_ensayo: e.codigo_tipo_ensayo,
            nombre_tipo_ensayo: e.tipo_ensayo?.nombre_tipo_ensayo,
            estado: e.estado,
        })),
        total_resultados_capturados: totalResultadosCapturados,
    };
}

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

            // Incluye versiones inactivas: los ensayos ya capturados siguen
            // apuntando a la tabla que se les asignó (no a la última versión).
            const { count, rows } = await Tabla.findAndCountAll({
                limit: parseInt(limit),
                offset: parseInt(offset),
                include: [
                    { model: Tipo_ensayo, as: 'tipo_ensayo', required: false }
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

    // ¿Está la tabla en uso? Formularios activos que la referencian y ensayos
    // (Ensayo_categoria_ensayo) que dependen de esos formularios. Consultado
    // antes de intentar eliminar, para decidir si se bloquea o se procede.
    getDependencias: async (req, res) => {
        try {
            const codigoTabla = parseInt(req.params.id, 10);
            if (!Number.isFinite(codigoTabla)) {
                return res.status(400).json({ error: 'id inválido' });
            }

            const dependencias = await resolveDependenciasTabla(codigoTabla);
            return res.status(200).json({ data: dependencias });
        } catch (error) {
            handleError(res, error, 'Error checking tabla dependencies');
        }
    },

    // Deactivate record (soft delete) en cascada: columna, celda, formula,
    // dependencias y los vínculos formulario_tabla de esta tabla. Bloquea si
    // algún formulario activo todavía la usa (ver getDependencias).
    deactivate: async (req, res) => {
        const t = await sequelize.transaction();
        try {
            const codigoTabla = parseInt(req.params.id, 10);
            if (!Number.isFinite(codigoTabla)) {
                await t.rollback();
                return res.status(400).json({ error: 'id inválido' });
            }

            const record = await Tabla.findByPk(codigoTabla, { transaction: t });
            if (!record) {
                await t.rollback();
                return res.status(404).json({ error: 'Record not found' });
            }

            // Re-verificar en el servidor: nunca confiar en un chequeo previo del cliente.
            const dependencias = await resolveDependenciasTabla(codigoTabla);
            if (dependencias.en_uso) {
                await t.rollback();
                return res.status(409).json({
                    error: 'La tabla está en uso por al menos un formulario activo y no se puede eliminar.',
                    dependencias,
                });
            }

            const celdas = await Celda.findAll({
                where: { codigo_tabla: codigoTabla },
                attributes: ['codigo_celda'],
                transaction: t,
            });
            const celdaIds = celdas.map((c) => c.codigo_celda);

            const formulas = celdaIds.length
                ? await Formula.findAll({
                      where: { codigo_celda: { [Op.in]: celdaIds } },
                      attributes: ['codigo_formula'],
                      transaction: t,
                  })
                : [];
            const formulaIds = formulas.map((f) => f.codigo_formula);

            if (formulaIds.length || celdaIds.length) {
                await Dependencias.update(
                    { estado: 'I' },
                    {
                        where: {
                            [Op.or]: [
                                formulaIds.length ? { codigo_formula: { [Op.in]: formulaIds } } : null,
                                celdaIds.length ? { codigo_celda: { [Op.in]: celdaIds } } : null,
                            ].filter(Boolean),
                        },
                        transaction: t,
                    }
                );
            }

            if (celdaIds.length) {
                await Formula.update(
                    { estado: 'I' },
                    { where: { codigo_celda: { [Op.in]: celdaIds } }, transaction: t }
                );
                await Celda.update(
                    { estado: 'I' },
                    { where: { codigo_tabla: codigoTabla }, transaction: t }
                );
            }

            await Columna.update(
                { estado: 'I' },
                { where: { codigo_tabla: codigoTabla }, transaction: t }
            );

            // Vínculos con formularios (ya se verificó arriba que ninguno está activo).
            await Formulario_tabla.update(
                { estado: 'I' },
                { where: { codigo_tabla: codigoTabla }, transaction: t }
            );

            record.estado = 'I';
            await record.save({ transaction: t });

            await t.commit();

            return res.status(200).json({
                message: 'Tabla y sus relaciones (columnas, celdas, fórmulas, dependencias y vínculos con formularios) desactivadas correctamente.',
                id: codigoTabla,
            });
        } catch (error) {
            await t.rollback();
            handleError(res, error, 'Error deactivating record');
        }
    }
};
