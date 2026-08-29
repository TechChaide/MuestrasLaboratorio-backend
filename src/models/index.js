const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const basename = path.basename(__filename);
const db = {};

// Import sequelize instance from src/config/database.js
const sequelize = require('../config/database');

// Load all models automatically
fs
  .readdirSync(__dirname)
  .filter(file => {
    return (file.indexOf('.') !== 0) && 
           (file !== basename) && 
           (file.slice(-3) === '.js' &&
           !file.includes('.test.js'));
  })
  .forEach(file => {
    const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
    db[model.name] = model;
  });

// Setup relationships between models
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

// Export sequelize instance and models
db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;