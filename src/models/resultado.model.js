const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Resultado = sequelize.define('Resultado', {
        
        codigo_resultado: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false
        },
        
        codigo_ensayo_categoria_ensayo: {
            type: DataTypes.INTEGER
        },
        
        codigo_celda: {
            type: DataTypes.INTEGER
        },
        
        fecha_generacion: {
            type: DataTypes.DATE
        },
        
        toma: {
            type: DataTypes.INTEGER
        },
        
        // DECIMAL amplio: el redondeo a 2 decimales recortaba lo escrito.
        // Si llega el texto del usuario ("108.12"), se guarda ese texto.
        valor: {
            type: DataTypes.DECIMAL(28, 10),
            set(value) {
                if (value === null || value === undefined || value === '') {
                    this.setDataValue('valor', null);
                    return;
                }
                if (typeof value === 'string') {
                    const texto = value.trim().replace(',', '.');
                    if (/^-?\d+(\.\d+)?$/.test(texto)) {
                        this.setDataValue('valor', texto);
                        return;
                    }
                }
                const numero = Number(value);
                this.setDataValue('valor', Number.isFinite(numero) ? String(numero) : null);
            }
        },
        
        resultados: {
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
        tableName: 'resultado',
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
    Resultado.associate = (models) => {
        Resultado.belongsTo(models.Celda, {
        foreignKey: 'codigo_celda',
        as: 'celda',
        targetKey: 'codigo_celda'
    });
    Resultado.belongsTo(models.Ensayo_categoria_ensayo, {
        foreignKey: 'codigo_ensayo_categoria_ensayo',
        as: 'ensayo_categoria_ensayo',
        targetKey: 'codigo_ensayo_categoria_ensayo'
    });
    };

    return Resultado;
};