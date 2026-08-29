const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Solicitud = sequelize.define('Solicitud', {
        
        codigo_solicitud: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false
        },
        
        identificador_ensayo: {
            type: DataTypes.STRING
        },
        
        descripcion: {
            type: DataTypes.STRING
        },
        
        fecha_fab_adq: {
            type: DataTypes.DATE
        },
        
        correos_objetivo: {
            type: DataTypes.STRING
        },
        
        aceptacion_terminos: {
            type: DataTypes.BOOLEAN
        },
        
        estado_solicitud: {
            type: DataTypes.STRING
        },
        
        estado: {
            type: DataTypes.STRING
        },
        
        fecha_modificacion: {
            type: DataTypes.DATE
        },
        
        usuario_mnodificacion: {
            type: DataTypes.STRING
        }
        
    }, {
        tableName: 'solicitud',
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
    Solicitud.associate = (models) => {
        
    };

    return Solicitud;
};