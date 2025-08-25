// controllers/user.controller.js
const userService = require('../services/user.service');

/**
 * ฟังก์ชันกลางสำหรับจัดการข้อผิดพลาดและส่ง response กลับไป
 */
const handleErrors = (res, error) => {
    console.error("!!! รายละเอียดข้อผิดพลาด:", error);

    const message = error.message;
    // ตรวจจับข้อความ error ที่มาจาก service (ซึ่งเป็นภาษาไทยแล้ว)
    if (message.includes('ข้อมูลไม่ถูกต้อง')) return res.status(400).send({ message });
    if (message.includes('ถูกใช้งานแล้ว')) return res.status(409).send({ message });
    if (message.includes('ไม่พบข้อมูล')) return res.status(404).send({ message });
    
    // Error อื่นๆ ที่ไม่คาดคิด
    return res.status(500).send({ 
        message: "เกิดข้อผิดพลาดที่ไม่คาดคิด กรุณาตรวจสอบ log ของเซิร์ฟเวอร์",
        error: message 
    });
};

/**
 * สร้างผู้ใช้ใหม่ (ส่วนนี้มักจะถูกเรียกใช้ผ่าน auth.controller.register)
 */
exports.create = async (req, res) => {
    try {
        const user = await userService.createUser(req.body);
        res.status(201).send(user);
    } catch (error) {
        handleErrors(res, error);
    }
};

/**
 * ดึงข้อมูลผู้ใช้ทั้งหมด (สำหรับ Admin)
 */
exports.findAll = async (req, res) => {
    try {
        const users = await userService.getAllUsers();
        res.status(200).send(users);
    } catch (error) {
        handleErrors(res, error);
    }
};

/**
 * ดึงข้อมูลผู้ใช้ด้วย ID
 */
exports.findOne = async (req, res) => {
    try {
        // ตรวจสอบสิทธิ์: ผู้ใช้สามารถดูได้เฉพาะข้อมูลของตัวเอง
        if (req.userId !== req.params.id) {
            return res.status(403).send({ message: "คุณไม่มีสิทธิ์เข้าถึงข้อมูลนี้" });
        }
        const user = await userService.getUserById(req.params.id);
        res.status(200).send(user);
    } catch (error) {
        handleErrors(res, error);
    }
};

/**
 * อัปเดตข้อมูลผู้ใช้
 */
exports.update = async (req, res) => {
    try {
        // ตรวจสอบสิทธิ์: ผู้ใช้สามารถแก้ไขได้เฉพาะข้อมูลของตัวเอง
        if (req.userId !== req.params.id) {
            return res.status(403).send({ message: "คุณไม่มีสิทธิ์แก้ไขข้อมูลนี้" });
        }
        const updatedUser = await userService.updateUser(req.params.id, req.body);
        res.status(200).send(updatedUser);
    } catch (error) {
        handleErrors(res, error);
    }
};

/**
 * ลบข้อมูลผู้ใช้
 */
exports.delete = async (req, res) => {
    try {
        // ตรวจสอบสิทธิ์: ผู้ใช้สามารถลบได้เฉพาะบัญชีของตัวเอง
        if (req.userId !== req.params.id) {
            return res.status(403).send({ message: "คุณไม่มีสิทธิ์ลบบัญชีนี้" });
        }
        const result = await userService.deleteUser(req.params.id);
        res.status(200).send(result); // result จาก service จะมี message ภาษาไทยอยู่แล้ว
    } catch (error) {
        handleErrors(res, error);
    }
};