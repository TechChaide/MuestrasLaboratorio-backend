const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Tabla = sequelize.define('Tabla', {
        
        codigo_tabla: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false
        },
        
        codigo_tipo_ensayo: {
            type: DataTypes.INTEGER
        },
        
        nombre_tabla: {
            type: DataTypes.STRING
        },
        
        filas_muestra: {
            type: DataTypes.INTEGER
        },
        
        numero_columnas: {
            type: DataTypes.INTEGER
        },
        
        numero_filas_diseno: {
            type: DataTypes.INTEGER
        },
        
        version: {
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
        tableName: 'tabla',
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
    Tabla.associate = (models) => {
        Tabla.belongsTo(models.Tipo_ensayo, {
        foreignKey: 'codigo_tipo_ensayo',
        as: 'tipo_ensayo',
        targetKey: 'codigo_tipo_ensayo'
    });
    };

    return Tabla;
};