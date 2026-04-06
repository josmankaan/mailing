const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, '../db/database.sqlite'),
  logging: false
});

const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;

// Models
db.User = require('./User')(sequelize, DataTypes);
db.History = require('./History')(sequelize, DataTypes);

// Associations
db.User.hasMany(db.History, { foreignKey: 'userId', as: 'histories' });
db.History.belongsTo(db.User, { foreignKey: 'userId', as: 'user' });

module.exports = db;
