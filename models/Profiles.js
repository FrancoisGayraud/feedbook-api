/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('Profiles', {
    public_username: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    bio: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    gender: {
      type: DataTypes.STRING(1),
      allowNull: true
    },
    id: {
      type: DataTypes.INTEGER(11),
      allowNull: true,
      primaryKey: true,
      autoIncrement: true
    },
    user_id: {
      type: DataTypes.INTEGER(11),
      allowNull: true
    }
  }, {
    tableName: 'accounts_profile'
  });
};
