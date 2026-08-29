const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Celda = sequelize.define('Celda', {
        
        codigo_celda: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false
        },
        
        codigo_tabla: {
            type: DataTypes.INTEGER
        },
        
        codigo_columna: {
            type: DataTypes.INTEGER
        },
        
        fila: {
            type: DataTypes.INTEGER
        },
        
        col: {
            type: DataTypes.INTEGER
        },
        
        rowspan: {
            type: DataTypes.INTEGER
        },
        
        colspan: {
            type: DataTypes.INTEGER
        },
        
        tipo_celda: {
            type: DataTypes.STRING
        },
        
        alias: {
            type: DataTypes.STRING
        },
        
        campo_obligatorio: {
            type: DataTypes.BOOLEAN
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
        tableName: 'celda',
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
    Celda.associate = (models) => {
        Celda.belongsTo(models.Columna, {
        foreignKey: 'codigo_columna',
        as: 'columna',
        targetKey: 'codigo_columna'
    });
    Celda.belongsTo(models.Tabla, {
        foreignKey: 'codigo_tabla',
        as: 'tabla',
        targetKey: 'codigo_tabla'
    });
    };

    return Celda;
};