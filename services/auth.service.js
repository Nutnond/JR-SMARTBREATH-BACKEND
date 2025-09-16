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
        throw new Error('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
    }

    // 2. เปรียบเทียบรหัสผ่านที่ส่งมากับรหัสผ่านที่ hash ไว้ใน DB
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
        throw new Error('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
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

/**
 * Creates a new user after validating and hashing the password.
 * @param {object} userData - Object containing all user details from the registration form.
 * @returns {Promise<object>} The newly created user object (without the password).
 */
const register = async (userData) => {
    // ✅ UPDATED: เพิ่มการตรวจสอบความสมเหตุสมผลของข้อมูล
    if (typeof userData.weight !== 'number' || userData.weight < 10 || userData.weight > 500) {
        throw new Error('ค่าน้ำหนักไม่ถูกต้อง (ต้องเป็นตัวเลขระหว่าง 10 - 500 กก.)');
    }
    if (typeof userData.height !== 'number' || userData.height < 50 || userData.height > 300) {
        throw new Error('ค่าส่วนสูงไม่ถูกต้อง (ต้องเป็นตัวเลขระหว่าง 50 - 300 ซม.)');
    }

    // 1. ตรวจสอบว่ามีชื่อผู้ใช้หรืออีเมลนี้ในระบบแล้วหรือยัง
    const existingUser = await User.findOne({
        where: {
            [db.Sequelize.Op.or]: [
                { username: userData.username },
                { email: userData.email }
            ]
        }
    });

    if (existingUser) {
        if (existingUser.username === userData.username) {
            throw new Error('ชื่อผู้ใช้นี้ถูกใช้งานแล้ว');
        }
        throw new Error('อีเมลนี้ถูกใช้งานในระบบแล้ว');
    }

    // 2. Hash รหัสผ่านก่อนบันทึกลง DB
    const hashedPassword = await bcrypt.hash(userData.password, 8);
    
    // 3. สร้างผู้ใช้ใหม่ในฐานข้อมูล
    const newUser = await User.create({
        username: userData.username,
        email: userData.email,
        password: hashedPassword,
        weight: userData.weight,
        height: userData.height,
        gender: userData.gender,
        age: userData.age,
        firstName: userData.firstName,
        lastName: userData.lastName,
        dob: userData.dob
    });

    // 4. คืนค่าข้อมูลผู้ใช้ใหม่ (โดยลบรหัสผ่านออก)
    const userWithoutPassword = { ...newUser.get({ plain: true }) };
    delete userWithoutPassword.password;

    return userWithoutPassword;
};


module.exports = {
    login,
    register
};