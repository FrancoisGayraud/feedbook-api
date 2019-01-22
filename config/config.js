const Sequelize = require('sequelize');
const sequelize = new Sequelize('Feedbook', 'FeedbookAPI', 'Feedbook100596API', {
  host: '54.38.185.247',
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
