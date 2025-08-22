// models/record.model.js
const { DataTypes } = require('sequelize');
const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize) => {
  const Record = sequelize.define('Record', {
    id: {
      type: DataTypes.CHAR(36),
      defaultValue: () => uuidv4(),
      primaryKey: true,
    },
    machineId: {
      type: DataTypes.CHAR(36),
      allowNull: false,
      field: 'machine_id',
    },
    spo2: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    fev1: {
      type: DataTypes.DECIMAL(6, 2),
      allowNull: false,
    },
    fvc: {
      type: DataTypes.DECIMAL(6, 2),
      allowNull: false,
    },
    pef: {
      type: DataTypes.DECIMAL(6, 2),
      allowNull: false,
    },
    fev1Fvc: {
      type: DataTypes.DECIMAL(6, 4),
      field: 'fev1_fvc', // DB จะคำนวณให้เอง เราไม่ต้องทำอะไร
    },
    measuredAt: {
      type: DataTypes.DATE,
      field: 'measured_at',
    },
  }, {
    tableName: 'smartbreath_record',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    underscored: true
  });
  return Record;
};