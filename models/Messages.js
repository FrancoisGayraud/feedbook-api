/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('Messages', {
    sender_id: {
      type: DataTypes.INTEGER(11),
      allowNull: true
    },
    receiver_id: {
      type: DataTypes.INTEGER(11),
      allowNull: true
    },
    id: {
      type: DataTypes.INTEGER(11),
      primaryKey: true,
      autoIncrement: true
    },
    content: {
      type: DataTypes.STRING(1000),
      allowNull: true
    },
    subject: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    sent_at: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'Messages'
  });
};
