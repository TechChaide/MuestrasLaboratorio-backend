const app = require('./src/app');

const PORT = process.env.PORT || 5400;

const server = app.listen(PORT, () => {
    console.log('=============================================');
    console.log('=                                           =');
    console.log(`= SQL Server Backend: http://localhost:${PORT} =`);
    console.log('=                                           =');
    console.log('=============================================');
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    server.close(() => {
        console.log('Process terminated');
    });
});

process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully');
    server.close(() => {
        console.log('Process terminated');
    });
});