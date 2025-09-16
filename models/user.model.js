// models/user.model.js
const { DataTypes } = require('sequelize');
const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.CHAR(36),
      defaultValue: () => uuidv4(),
      primaryKey: true,
      allowNull: false,
    },
    firstName: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: 'first_name',
    },
    lastName: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: 'last_name',
    },
    username: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    dob: {
      type: DataTypes.DATEONLY,
      field: 'date_of_birth',
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    weight: {
      type: DataTypes.DECIMAL(6, 2),
      allowNull: false,
    },
    height: {
      type: DataTypes.DECIMAL(6, 2),
      allowNull: false,
    },
    gender: {
      type: DataTypes.ENUM('Male', 'Female', 'Other'),
      allowNull: false,
    },
    createdAt: { // Sequelize จะจัดการฟิลด์นี้อัตโนมัติ
        type: DataTypes.DATE,
        field: 'created_at'
    },
    updatedAt: { // Sequelize จะจัดการฟิลด์นี้อัตโนมัติ
        type: DataTypes.DATE,
        field: 'updated_at'
    }
  }, {
    tableName: 'users',
    timestamps: true, // เปิดใช้งาน createdAt และ updatedAt
    underscored: true
  });

  return User;
};