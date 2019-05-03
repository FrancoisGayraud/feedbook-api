/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('Users', {
    email: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    last_login: {
      type: DataTypes.DATE,
      allowNull: true
    },
    date_joined: {
      type: DataTypes.DATE,
      allowNull: true
    },
    first_name: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    last_name: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    is_superuser: {
      type: DataTypes.INTEGER(1),
      allowNull: true
    },
    is_staff: {
      type: DataTypes.INTEGER(1),
      allowNull: true
    },
    is_active: {
      type: DataTypes.INTEGER(1),
      allowNull: true
    },
    id: {
      type: DataTypes.INTEGER(7),
      primaryKey: true,
      autoIncrement: true
    },
    refresh_token: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    profile_picture: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    token: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    reset_password_code: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    username: {
      type: DataTypes.STRING(255),
      allowNull: true
    }
  }, {
    tableName: 'auth_user'
  });
};
