const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Tipo_ensayo = sequelize.define('Tipo_ensayo', {
        
        codigo_tipo_ensayo: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false
        },
        
        codigo_familia: {
            type: DataTypes.INTEGER
        },
        
        nombre_tipo_ensayo: {
            type: DataTypes.STRING
        },
        
        mnemonico: {
            type: DataTypes.STRING
        },
        
        estado: {
            type: DataTypes.STRING
        },
        
        fecha_creacion: {
            type: DataTypes.DATE
        },
        
        usuario_creacion: {
            type: DataTypes.STRING
        }
        
    }, {
        tableName: 'tipo_ensayo',
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
    Tipo_ensayo.associate = (models) => {
        Tipo_ensayo.belongsTo(models.Familia, {
        foreignKey: 'codigo_familia',
        as: 'familia',
        targetKey: 'codigo_familia'
    });
    };

    return Tipo_ensayo;
};