const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Columna = sequelize.define('Columna', {
        
        codigo_columna: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false
        },
        
        codigo_tabla: {
            type: DataTypes.INTEGER
        },
        
        indice: {
            type: DataTypes.INTEGER
        },
        
        nombre_columna: {
            type: DataTypes.STRING
        },
        
        unidades: {
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
        tableName: 'columna',
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
    Columna.associate = (models) => {
        Columna.belongsTo(models.Tabla, {
        foreignKey: 'codigo_tabla',
        as: 'tabla',
        targetKey: 'codigo_tabla'
    });
    };

    return Columna;
};