const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Muestra = sequelize.define('Muestra', {
        
        codigo_muestra: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false
        },
        
        codigo_familia_material: {
            type: DataTypes.INTEGER
        },
        
        nombre_material_muestra: {
            type: DataTypes.STRING,
            allowNull: false
        },
        
        area_material: {
            type: DataTypes.STRING
        },
        
        detalle_material: {
            type: DataTypes.STRING
        },
        
        material: {
            type: DataTypes.STRING
        },
        
        fecha_carga: {
            type: DataTypes.DATE
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
        tableName: 'muestra',
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
    Muestra.associate = (models) => {
        Muestra.hasMany(models.Ensayo_categoria_ensayo, {
            foreignKey: 'codigo_muestra',
            as: 'ensayosCategoriaEnsayo',
            sourceKey: 'codigo_muestra'
        });
    };

    return Muestra;
};