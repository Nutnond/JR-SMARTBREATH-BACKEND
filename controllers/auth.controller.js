// controllers/auth.controller.js
const authService = require('../services/auth.service');

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).send({ message: "กรุณากรอกชื่อผู้ใช้และรหัสผ่าน" });
    }

    const result = await authService.login(username, password);
    res.send(result);

  } catch (error) {
    res.status(401).send({ message: error.message || "การยืนยันตัวตนล้มเหลว" });
  }
};


/**
 * จัดการการสมัครสมาชิกใหม่พร้อมข้อมูลโปรไฟล์ทั้งหมด
 */
exports.register = async (req, res) => {
  try {
    // 1. ดึงข้อมูลทั้งหมดจาก request body
    const {
      username,
      email,
      password,
      weight,
      height,
      gender,
      dob,
      firstName,
      lastName
    } = req.body;

    // 2. ตรวจสอบว่ามีข้อมูลที่จำเป็นครบถ้วน
    if (!username || !email || !password || !weight || !height || !gender || !dob || !firstName || !lastName) {
      return res.status(400).send({ message: "กรุณากรอกข้อมูลการสมัครสมาชิกให้ครบถ้วน" });
    }
    
    // ตรวจสอบความยาวรหัสผ่าน (ควรตรงกับ validation ใน service)
    if (password.length < 8) {
        return res.status(400).send({ message: "รหัสผ่านต้องมีความยาวอย่างน้อย 8 ตัวอักษร" });
    }

    // 3. ส่งข้อมูลทั้งหมดไปให้ service
    const newUser = await authService.register({
      username,
      email,
      password,
      weight,
      height,
      gender,
      firstName,
      lastName,
      dob
    });

    // 4. ส่ง response การสมัครสำเร็จ (โดยไม่มีรหัสผ่าน)
    res.status(201).send({
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        message: "สมัครสมาชิกสำเร็จ"
    });

  } catch (error) {
    // จัดการข้อผิดพลาดเฉพาะ เช่น ชื่อผู้ใช้หรืออีเมลซ้ำ
    // (ข้อความ error.message จะมาจาก service ซึ่งเป็นภาษาไทยอยู่แล้ว)
    if (error.message.includes('ถูกใช้งานแล้ว')) {
        return res.status(409).send({ message: error.message });
    }
    // จัดการข้อผิดพลาดอื่นๆ
    res.status(500).send({ message: error.message || "เกิดข้อผิดพลาดระหว่างการสมัครสมาชิก" });
  }
};