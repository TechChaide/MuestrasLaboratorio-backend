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
sequelize.authenticate()
    .then(() => {
        console.log('✅ SQL Server connection established successfully');
        
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