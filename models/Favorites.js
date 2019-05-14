/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('Favorites', {
    title: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    user_id: {
      type: DataTypes.INTEGER(7),
      allowNull: true
    },
    book_id: {
      type: DataTypes.INTEGER(7),
      allowNull: true
    },
    type: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    pub_type: {
      type: DataTypes.STRING(1),
      allowNull: true
    },
    id: {
      type: DataTypes.INTEGER(7),
      primaryKey: true,
      autoIncrement: true
    }
  }, {
    tableName: 'Favorites'
  });
};
