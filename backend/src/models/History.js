module.exports = (sequelize, DataTypes) => {
  const History = sequelize.define('History', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    sector: {
      type: DataTypes.STRING,
      allowNull: true
    },
    city: {
      type: DataTypes.STRING,
      allowNull: true
    },
    dataPayload: {
      type: DataTypes.TEXT, // We'll stringify JSON payload containing final export data
      allowNull: false
    },
    isMailed: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  });

  return History;
};
