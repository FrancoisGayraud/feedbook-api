/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('Comments', {
    content: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    id: {
      type: DataTypes.INTEGER(7),
      allowNull: true,
      primaryKey: true,
      autoIncrement: true
    },
    user_id: {
      type: DataTypes.INTEGER(7),
      allowNull: true
    },
    book_id: {
      type: DataTypes.INTEGER(7),
      allowNull: true
    }
  }, {
    tableName: 'Comments'
  });
};
