const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Familia = sequelize.define('Familia', {
        
        codigo_familia: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false
        },
        
        nombre_familia: {
            type: DataTypes.STRING
        },
        
        mnemonico: {
            type: DataTypes.STRING
        },
        
        detalle: {
            type: DataTypes.STRING
        },
        
        probetas_minimas: {
            type: DataTypes.INTEGER
        },
        
        estado: {
            type: DataTypes.STRING
        },
        
        fecha_modificacion: {
            type: DataTypes.DATE
        },
        
        usuario_modificacion: {
            type: DataTypes.STRING
        }
        
    }, {
        tableName: 'familia',
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
    Familia.associate = (models) => {
        
    };

    return Familia;
};