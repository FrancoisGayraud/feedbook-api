/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('Books', {
    title: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    user_id: {
      type: DataTypes.INTEGER(7),
      allowNull: true
    },
    type: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    id: {
      type: DataTypes.INTEGER(7),
      primaryKey: true,
      autoIncrement: true
    },
    image_url: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    pdf_url: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    description: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    pub_type: {
      type: DataTypes.STRING(1),
      allowNull: true
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    grade: {
      type: DataTypes.INTEGER(1),
      allowNull: true
    }
  }, {
    tableName: 'Books'
  });
};
