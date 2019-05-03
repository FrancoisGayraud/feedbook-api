/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('Reviewers', {
    id: {
      type: DataTypes.INTEGER(11),
      primaryKey: true,
      autoIncrement: true
    },
    reviewer_id: {
      type: DataTypes.INTEGER(11),
      allowNull: true
    },
    author_id: {
      type: DataTypes.INTEGER(11),
      allowNull: true
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'Reviewers'
  });
};
