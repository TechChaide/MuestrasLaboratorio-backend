const { Sequelize } = require('sequelize');

// SQL Server connection configuration
const sequelize = new Sequelize({
    dialect: 'mssql',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 1433,
    database: process.env.DB_NAME || 'master',
    username: process.env.DB_USER || 'sa',
    password: process.env.DB_PASSWORD || 'YourPassword123',
    
    // SQL Server specific options
    dialectOptions: {
        options: {
            encrypt: process.env.DB_ENCRYPT === 'true' || false, // Use encryption
            trustServerCertificate: process.env.DB_TRUST_CERT === 'true' || true, // Trust self-signed certificates
            instanceName: process.env.DB_INSTANCE || '', // SQL Server instance name
            requestTimeout: 30000, // Request timeout
            connectionTimeout: 30000, // Connection timeout
        }
    },
    
    // Connection pool settings
    pool: {
        max: 10,
        min: 0,
        acquire: 30000,
        idle: 10000
    },
    
    // Logging
    logging: false,
    
    // Sync options
    sync: {
        alter: false,
        force: false
    }
});

// Test connection
/** DECIMAL(18,2) redondeaba el valor al guardarlo. Se amplía sin perder datos. */
async function ampliarColumnaValor() {
    const [rows] = await sequelize.query(`
        SELECT c.scale AS scale
        FROM sys.columns c
        INNER JOIN sys.tables t ON c.object_id = t.object_id
        INNER JOIN sys.schemas s ON t.schema_id = s.schema_id
        WHERE s.name = N'dbo' AND t.name = N'resultado' AND c.name = N'valor'
    `);
    const row = rows && rows[0];
    const scale = row ? Number(row.scale ?? row.SCALE) : null;
    if (scale == null || scale >= 10) return;
    await sequelize.query(`ALTER TABLE dbo.resultado ALTER COLUMN valor DECIMAL(28, 10) NULL`);
    console.log('✅ resultado.valor ampliado a DECIMAL(28, 10)');
}

sequelize.authenticate()
    .then(() => {
        console.log('✅ SQL Server connection established successfully');
        ampliarColumnaValor().catch((err) => {
            console.error('❌ No se pudo ampliar resultado.valor:', err.message);
        });
        
        // Sync database (optional)
        if (process.env.DB_SYNC === 'true') {
            sequelize.sync(sequelize.options.sync)
                .then(() => console.log('✅ Database synchronized'))
                .catch(err => console.error('❌ Database sync error:', err));
        }
    })
    .catch(err => {
        console.error('❌ Database connection error:', err);
    });

module.exports = sequelize;