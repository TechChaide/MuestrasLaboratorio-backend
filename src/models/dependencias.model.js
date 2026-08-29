const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Dependencias = sequelize.define('Dependencias', {
        
        codigo_dependencia: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false
        },
        
        codigo_formula: {
            type: DataTypes.INTEGER
        },
        
        codigo_celda: {
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
        tableName: 'dependencias',
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
    Dependencias.associate = (models) => {
        Dependencias.belongsTo(models.Celda, {
        foreignKey: 'codigo_celda',
        as: 'celda',
        targetKey: 'codigo_celda'
    });
    Dependencias.belongsTo(models.Formula, {
        foreignKey: 'codigo_formula',
        as: 'formula',
        targetKey: 'codigo_formula'
    });
    };

    return Dependencias;
};