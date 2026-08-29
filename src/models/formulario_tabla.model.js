const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Formulario_tabla = sequelize.define('Formulario_tabla', {
        
        codigo_formulario_tabla: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false
        },
        
        codigo_formulario: {
            type: DataTypes.INTEGER
        },
        
        codigo_tabla: {
            type: DataTypes.INTEGER
        },
        
        cabecera_formulario: {
            type: DataTypes.STRING
        },
        
        posicion: {
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
        tableName: 'formulario_tabla',
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
    Formulario_tabla.associate = (models) => {
        Formulario_tabla.belongsTo(models.Formulario, {
        foreignKey: 'codigo_formulario',
        as: 'formulario',
        targetKey: 'codigo_formulario'
    });
    Formulario_tabla.belongsTo(models.Tabla, {
        foreignKey: 'codigo_tabla',
        as: 'tabla',
        targetKey: 'codigo_tabla'
    });
    };

    return Formulario_tabla;
};