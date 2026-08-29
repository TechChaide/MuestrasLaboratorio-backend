const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Formula = sequelize.define('Formula', {
        
        codigo_formula: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false
        },
        
        codigo_celda: {
            type: DataTypes.INTEGER
        },
        
        nombre: {
            type: DataTypes.STRING
        },
        
        expresion: {
            type: DataTypes.STRING
        },
        
        latex: {
            type: DataTypes.STRING
        },
        
        ambito: {
            type: DataTypes.STRING
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
        tableName: 'formula',
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
    Formula.associate = (models) => {
        Formula.belongsTo(models.Celda, {
        foreignKey: 'codigo_celda',
        as: 'celda',
        targetKey: 'codigo_celda'
    });
    };

    return Formula;
};