// controllers/machine.controller.js
const machineService = require('../services/machine.service');

/**
 * ฟังก์ชันกลางสำหรับจัดการข้อผิดพลาดและส่ง response กลับไป
 */
const handleErrors = (res, error) => {
    console.error("!!! รายละเอียดข้อผิดพลาด:", error); // Log error ไว้สำหรับตรวจสอบ
    const message = error.message;

    // ตรวจจับข้อความ error ที่มาจาก service (ซึ่งเป็นภาษาไทยแล้ว)
    if (message.includes('ข้อมูลไม่ถูกต้อง')) return res.status(400).send({ message });
    if (message.includes('ถูกใช้งานแล้ว')) return res.status(409).send({ message });
    if (message.includes('ไม่พบข้อมูล')) return res.status(404).send({ message });
    
    // Error อื่นๆ ที่ไม่คาดคิด
    return res.status(500).send({ message: "เกิดข้อผิดพลาดที่ไม่คาดคิดในระบบ" });
};

/**
 * สร้างเครื่องใหม่
 */
exports.create = async (req, res) => {
    try {
        const machine = await machineService.createMachine(req.body);
        res.status(201).send(machine);
    } catch (error) {
        handleErrors(res, error);
    }
};

/**
 * ดึงข้อมูลเครื่องทั้งหมดที่เป็นของ User ที่ login อยู่
 */
exports.findAll = async (req, res) => {
    try {
        // บังคับให้ใช้ ID ของผู้ใช้ที่ login อยู่เสมอ เพื่อความปลอดภัย
        const ownerId = req.userId; 
        
        const machines = await machineService.getAllMachines(ownerId);
        res.status(200).send(machines);
    } catch (error) {
        handleErrors(res, error);
    }
};

/**
 * ดึงข้อมูลเครื่องเดียวด้วย ID
 */
exports.findOne = async (req, res) => {
    try {
        const machine = await machineService.getMachineById(req.params.id);

        // --- 🔐 ตรวจสอบความเป็นเจ้าของ ---
        if (machine.ownerId !== req.userId) {
            return res.status(403).send({ message: "คุณไม่มีสิทธิ์เข้าถึงข้อมูลนี้" });
        }
        // --- สิ้นสุดการตรวจสอบ ---

        res.status(200).send(machine);
    } catch (error) {
        // getMachineById อาจจะ throw 'ไม่พบข้อมูลเครื่อง' ซึ่ง handleErrors จัดการได้
        handleErrors(res, error);
    }
};

/**
 * อัปเดตข้อมูลเครื่อง
 */
exports.update = async (req, res) => {
    try {
        const machineId = req.params.id;
        
        // 1. ดึงข้อมูลเครื่องเพื่อตรวจสอบความเป็นเจ้าของก่อน
        const machineToUpdate = await machineService.getMachineById(machineId);

        // 2. --- 🔐 ตรวจสอบความเป็นเจ้าของ ---
        if (machineToUpdate.ownerId !== req.userId) {
            return res.status(403).send({ message: "คุณไม่มีสิทธิ์แก้ไขข้อมูลนี้" });
        }
        // --- สิ้นสุดการตรวจสอบ ---

        // 3. ถ้าเป็นเจ้าของจริง จึงทำการอัปเดต
        const updatedMachine = await machineService.updateMachine(machineId, req.body);
        res.status(200).send(updatedMachine);

    } catch (error) {
        handleErrors(res, error);
    }
};

/**
 * ลบข้อมูลเครื่อง
 */
exports.delete = async (req, res) => {
    try {
        const machineId = req.params.id;

        // 1. ดึงข้อมูลเครื่องที่จะลบเพื่อตรวจสอบความเป็นเจ้าของก่อน
        const machineToDelete = await machineService.getMachineById(machineId);

        // 2. --- 🔐 ตรวจสอบความเป็นเจ้าของ ---
        if (machineToDelete.ownerId !== req.userId) {
            return res.status(403).send({ message: "คุณไม่มีสิทธิ์ลบข้อมูลนี้" });
        }
        // --- สิ้นสุดการตรวจสอบ ---

        // 3. ถ้าเป็นเจ้าของจริง จึงทำการลบ
        const result = await machineService.deleteMachine(machineId);
        res.status(200).send(result); // ส่ง message จาก service กลับไปโดยตรง

    } catch (error) {
        handleErrors(res, error);
    }
};