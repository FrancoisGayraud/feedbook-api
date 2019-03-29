const Sequelize = require('sequelize');
const sequelize = new Sequelize('Feedbook', 'FeedbookAPI', 'Feedbook100596API', {
  host: 'feedbook.fr',
  dialect: 'mysql',
  operatorsAliases: false,
  define: {
    timestamps: false
  },
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

module.exports = sequelize;
