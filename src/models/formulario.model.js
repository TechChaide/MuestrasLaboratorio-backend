const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Formulario = sequelize.define('Formulario', {
        
        codigo_formulario: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false
        },
        
        nombre_formulario: {
            type: DataTypes.STRING
        },
        
        version_formulario: {
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
        tableName: 'formulario',
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
    Formulario.associate = (models) => {
        
    };

    return Formulario;
};