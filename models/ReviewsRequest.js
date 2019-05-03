/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('ReviewsRequest', {
    id: {
      type: DataTypes.INTEGER(11),
      primaryKey: true,
      autoIncrement: true
    },
    author_id: {
      type: DataTypes.INTEGER(11),
      allowNull: true
    },
    book_id: {
      type: DataTypes.INTEGER(11),
      allowNull: true
    },
    start: {
      type: DataTypes.DATE,
      allowNull: true
    },
    end: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'ReviewsRequest'
  });
};
