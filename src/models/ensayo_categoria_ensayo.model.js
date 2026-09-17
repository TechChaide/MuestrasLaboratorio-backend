const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Ensayo_categoria_ensayo = sequelize.define('Ensayo_categoria_ensayo', {
        
        codigo_ensayo_categoria_ensayo: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false
        },
        
        codigo_solicitud: {
            type: DataTypes.INTEGER
        },
        
        codigo_muestra: {
            type: DataTypes.INTEGER
        },
        
        codigo_tipo_ensayo: {
            type: DataTypes.INTEGER
        },
        
        codigo_formulario: {
            type: DataTypes.INTEGER
        },
        
        responsable_ensayo: {
            type: DataTypes.STRING
        },

        correo_responsable_ensayo: {
            type: DataTypes.STRING
        },

        fecha_inicio: {
            type: DataTypes.DATE
        },
        
        fecha_fin: {
            type: DataTypes.DATE
        },
        
        fecha_extension: {
            type: DataTypes.DATE
        },
        
        estado: {
            type: DataTypes.STRING
        },
        
        fecha_creacion: {
            type: DataTypes.DATE
        },

        usuario_creacion: {
            type: DataTypes.STRING
        },

        // Aprobación de resultados (revisión posterior a la culminación de
        // la fase de captura de datos — ver mailer.js notificación 2.3/2.4).
        // codigo_estado_aprobacion: 'PA' pendiente, 'AP' aprobado, 'RE' rechazado.
        codigo_estado_aprobacion: {
            type: DataTypes.STRING
        },

        usuario_aprobacion: {
            type: DataTypes.STRING
        },

        fecha_aprobacion: {
            type: DataTypes.DATE
        },

        observaciones_aprobacion: {
            type: DataTypes.TEXT
        }

    }, {
        tableName: 'ensayo_categoria_ensayo',
        schema: 'dbo',
        timestamps: false,
        // SQL Server specific options
        dialectOptions: {
            options: {
                requestTimeout: 30000,
                encrypt: false,
                trustServerCertificate: true
            }
        }
    });

    // Setup relationships (only belongsTo)
    Ensayo_categoria_ensayo.associate = (models) => {
        Ensayo_categoria_ensayo.belongsTo(models.Formulario, {
        foreignKey: 'codigo_formulario',
        as: 'formulario',
        targetKey: 'codigo_formulario'
    });
    Ensayo_categoria_ensayo.belongsTo(models.Muestra, {
        foreignKey: 'codigo_muestra',
        as: 'muestra',
        targetKey: 'codigo_muestra'
    });
    Ensayo_categoria_ensayo.belongsTo(models.Solicitud, {
        foreignKey: 'codigo_solicitud',
        as: 'solicitud',
        targetKey: 'codigo_solicitud'
    });
    Ensayo_categoria_ensayo.belongsTo(models.Tipo_ensayo, {
        foreignKey: 'codigo_tipo_ensayo',
        as: 'tipo_ensayo',
        targetKey: 'codigo_tipo_ensayo'
    });
    };

    return Ensayo_categoria_ensayo;
};