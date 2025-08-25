// services/machine.service.js
const Joi = require('joi');
const { v4: uuidv4 } = require('uuid');
const { Machine, User } = require('../models');

// Schema สำหรับการตรวจสอบข้อมูลตอนสร้างเครื่อง
const createMachineSchema = Joi.object({
    deviceName: Joi.string().min(3).max(100).required(),
    model : Joi.string().min(3).max(100).required(),
    ownerId: Joi.string().uuid().required(),
});

// Schema สำหรับการตรวจสอบข้อมูลตอนอัปเดตเครื่อง
const updateMachineSchema = Joi.object({
    deviceName: Joi.string().min(3).max(100).required(),
});

/**
 * สร้างเครื่องใหม่ในระบบ
 * @param {object} machineData - ข้อมูลสำหรับสร้างเครื่อง
 * @returns {Promise<Machine>}
 */
const createMachine = async (machineData) => {
    const { error, value } = createMachineSchema.validate(machineData);
    if (error) throw new Error(`ข้อมูลไม่ถูกต้อง: ${error.details[0].message}`);

    const owner = await User.findByPk(value.ownerId);
    if (!owner) throw new Error('ไม่พบข้อมูลผู้ใช้งาน');

    return await Machine.create({ id: uuidv4(), ...value });
};

/**
 * ดึงข้อมูลเครื่องทั้งหมด (สามารถกรองตาม ownerId ได้)
 * @param {string} [ownerId] - ID ของเจ้าของเครื่อง (optional)
 * @returns {Promise<Machine[]>}
 */
const getAllMachines = async (ownerId) => {
    const condition = ownerId ? { owner_id: ownerId } : null;
    return await Machine.findAll({ 
        where: condition, 
        include: [{ model: User, as: 'owner', attributes: ['id', 'username'] }] 
    });
};

/**
 * ดึงข้อมูลเครื่องด้วย ID
 * @param {string} id - ID ของเครื่อง
 * @returns {Promise<Machine>}
 */
const getMachineById = async (id) => {
    const machine = await Machine.findByPk(id, { 
        include: [{ model: User, as: 'owner', attributes: ['id', 'username', 'email'] }] 
    });
    if (!machine) throw new Error('ไม่พบข้อมูลเครื่อง');
    return machine;
};

/**
 * อัปเดตข้อมูลเครื่อง
 * @param {string} id - ID ของเครื่องที่ต้องการอัปเดต
 * @param {object} updateData - ข้อมูลที่ต้องการอัปเดต
 * @returns {Promise<Machine>}
 */
const updateMachine = async (id, updateData) => {
    const { error, value } = updateMachineSchema.validate(updateData);
    if (error) throw new Error(`ข้อมูลไม่ถูกต้อง: ${error.details[0].message}`);

    const machineToUpdate = await Machine.findByPk(id);
    if (!machineToUpdate) throw new Error('ไม่พบข้อมูลเครื่อง');

    // ตรวจสอบว่ามีการเปลี่ยนชื่อ และชื่อใหม่ซ้ำกับที่มีอยู่หรือไม่
    if (value.deviceName && value.deviceName !== machineToUpdate.deviceName) {
        const existingMachine = await Machine.findOne({ where: { deviceName: value.deviceName } });
        if (existingMachine) throw new Error('ชื่ออุปกรณ์นี้ถูกใช้งานแล้ว');
    }

    const [num] = await Machine.update(value, { where: { id: id } });
    if (num === 1) return await getMachineById(id);
    throw new Error('อัปเดตข้อมูลเครื่องไม่สำเร็จ');
};

/**
 * อัปเดตเฉพาะเวลา updatedAt ของเครื่อง
 * @param {string} id - ID ของเครื่อง
 * @returns {Promise<Machine>}
 */
const touchMachine = async (id) => {
    const [num] = await Machine.update(
        { updatedAt: new Date() },
        { where: { id: id } }
    );

    if (num === 1) {
        return await getMachineById(id);
    }
    
    throw new Error(`ไม่พบเครื่องที่มี ID ${id} หรืออัปเดตเวลาไม่สำเร็จ`);
};

/**
 * ลบข้อมูลเครื่อง
 * @param {string} id - ID ของเครื่องที่ต้องการลบ
 * @returns {Promise<{message: string}>}
 */
const deleteMachine = async (id) => {
    const num = await Machine.destroy({ where: { id: id } });
    if (num === 0) throw new Error('ไม่พบข้อมูลเครื่อง');
    return { message: 'ลบข้อมูลเครื่องสำเร็จ' };
};

module.exports = { 
    createMachine, 
    getAllMachines, 
    getMachineById, 
    updateMachine, 
    deleteMachine, 
    touchMachine 
};