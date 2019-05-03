/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('Reviews', {
    id: {
      type: DataTypes.INTEGER(11),
      primaryKey: true,
      autoIncrement: true
    },
    book_id: {
      type: DataTypes.INTEGER(11),
      allowNull: true
    },
    reviewer_id: {
      type: DataTypes.INTEGER(11),
      allowNull: true
    },
    review_request_id: {
      type: DataTypes.INTEGER(11),
      allowNull: true
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    review: {
      type: DataTypes.STRING(10000),
      allowNull: true
    },
    grade: {
      type: DataTypes.INTEGER(11),
      allowNull: true
    }
  }, {
    tableName: 'Reviews'
  });
};
