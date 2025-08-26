// models/machine.model.js
const { DataTypes } = require('sequelize');
const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize) => {
  const Machine = sequelize.define('Machine', {
    id: {
      type: DataTypes.CHAR(36),
      defaultValue: () => uuidv4(),
      primaryKey: true,
    },
    deviceName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      field: 'device_name',
    },
    model: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      field: 'model',
    },
    ownerId: {
      type: DataTypes.CHAR(36),
      allowNull: true,
      field: 'owner_id',
      references: {
        model: 'users', // ชื่อตาราง
        key: 'id'
      }
    },
    registeredAt: {
      type: DataTypes.DATE,
      field: 'registered_at',
    },
    updatedAt: {
      type: DataTypes.DATE,
      field: 'updated_at',
    }
  }, {
    tableName: 'smartbreath_machine',
    timestamps: true, // เปิดใช้งาน createdAt, updatedAt
    createdAt: 'registered_at', // Map createdAt ไปที่ registered_at
    updatedAt: 'updated_at',
    underscored: true
  });
  return Machine;
};