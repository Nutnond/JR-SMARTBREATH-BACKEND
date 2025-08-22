// services/auth.service.js
const db = require('../models');
const User = db.User;
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

dotenv.config();
const login = async (username, password) => {
  // 1. ค้นหา user จาก username ใน DB
  const user = await User.findOne({ where: { username: username } });
  if (!user) {
    throw new Error('Authentication failed! User not found.');
  }

  // 2. เปรียบเทียบรหัสผ่านที่ส่งมากับรหัสผ่านที่ hash ไว้ใน DB
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw new Error('Authentication failed! Wrong password.');
  }

  // 3. ถ้าทุกอย่างถูกต้อง, สร้าง JWT Token
  const token = jwt.sign(
    { id: user.id, username: user.username }, // Payload: ข้อมูลที่จะเก็บใน token
    process.env.JWT_SECRET, // Secret Key
    { expiresIn: process.env.JWT_EXPIRES_IN } // ตั้งเวลาหมดอายุ
  );

  // 4. คืนค่าข้อมูล user (ยกเว้นรหัสผ่าน) และ token
  const userWithoutPassword = { ...user.get({ plain: true }) };
  delete userWithoutPassword.password;

  return { user: userWithoutPassword, token };
};

module.exports = {
  login,
};