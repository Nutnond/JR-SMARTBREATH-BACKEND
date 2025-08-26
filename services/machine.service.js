// services/machine.service.js
const Joi = require('joi');
const { v4: uuidv4 } = require('uuid');
// ✅ UPDATED: เพิ่มการ import Model 'Record' และ 'sequelize' instance
const { Machine, User, Record, sequelize } = require('../models');

// Schema สำหรับการตรวจสอบข้อมูลตอนสร้างเครื่อง
const createMachineSchema = Joi.object({
    deviceName: Joi.string().min(3).max(100).required(),
    model: Joi.string().min(3).max(100).required(),
    ownerId: Joi.string().uuid().required(),
});

// Schema สำหรับการตรวจสอบข้อมูลตอนอัปเดตเครื่อง
const updateMachineSchema = Joi.object({
    deviceName: Joi.string().min(3).max(100).required(),
});

// Schema สำหรับการตรวจสอบข้อมูลตอนอัปเดตเครื่อง
const registerMachineSchema = Joi.object({
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
 */
const touchMachine = async (id) => {
    const [num] = await Machine.update({ updatedAt: new Date() }, { where: { id: id } });
    if (num === 1) return await getMachineById(id);
    throw new Error(`ไม่พบเครื่องที่มี ID ${id} หรืออัปเดตเวลาไม่สำเร็จ`);
};

/**
 * ✅ UPDATED: ลบข้อมูลเครื่องและข้อมูล Record ที่เกี่ยวข้องทั้งหมด
 * @param {string} id - ID ของเครื่องที่ต้องการลบ
 * @returns {Promise<{message: string}>}
 */
const deleteMachine = async (id) => {
    // ใช้ transaction เพื่อให้แน่ใจว่าหากขั้นตอนใดล้มเหลว การเปลี่ยนแปลงทั้งหมดจะถูกยกเลิก
    const t = await sequelize.transaction();

    try {
        // 1. ตรวจสอบว่ามีเครื่องนี้อยู่จริงหรือไม่
        const machine = await Machine.findByPk(id, { transaction: t });
        if (!machine) {
            // ไม่ต้อง rollback เพราะยังไม่ได้ทำอะไร และโยน error ออกไป
            throw new Error('ไม่พบข้อมูลเครื่อง');
        }

        // 2. ลบข้อมูล Record ทั้งหมดที่เชื่อมโยงกับ Machine ID นี้
        // **หมายเหตุ:** โปรดตรวจสอบว่า foreign key ใน Model 'Record' ของคุณชื่อ 'machine_id' ถูกต้อง
        await Record.destroy({
            where: { machine_id: id },
            transaction: t
        });

        // 3. ลบตัว Machine เอง
        await machine.destroy({ transaction: t });

        // 4. ถ้าทุกอย่างสำเร็จ, ยืนยันการเปลี่ยนแปลง
        await t.commit();

        return { message: 'ลบข้อมูลเครื่องและ Record ที่เกี่ยวข้องสำเร็จ' };

    } catch (error) {
        // 5. หากเกิดข้อผิดพลาด, ยกเลิกการเปลี่ยนแปลงทั้งหมด
        await t.rollback();
        // ส่งต่อ error ที่เกิดขึ้นเพื่อให้ controller หรือชั้นที่เรียกใช้จัดการต่อไป
        throw new Error(error.message || 'เกิดข้อผิดพลาดระหว่างการลบข้อมูลเครื่อง');
    }
};

/**
 * ✅ UPDATED: รีเซ็ตข้อมูลเครื่อง (เปลี่ยนชื่อเป็น UNNAMED, ownerId เป็น null) และลบ Record ที่เกี่ยวข้องทั้งหมด
 * @param {string} id - ID ของเครื่องที่ต้องการรีเซ็ต
 * @returns {Promise<{message: string}>}
 */
const resetMachine = async (id) => {
    // ใช้ transaction เพื่อให้แน่ใจว่าการดำเนินการทั้งหมด (ลบและอัปเดต) สำเร็จหรือล้มเหลวพร้อมกัน
    const t = await sequelize.transaction();

    try {
        // 1. ตรวจสอบว่ามีเครื่องนี้อยู่จริงหรือไม่
        const machine = await Machine.findByPk(id, { transaction: t });
        if (!machine) {
            // ไม่ต้อง rollback เพราะยังไม่ได้ทำอะไร และโยน error ออกไป
            throw new Error('ไม่พบข้อมูลเครื่อง');
        }

        // 2. ลบข้อมูล Record ทั้งหมดที่เชื่อมโยงกับ Machine ID นี้
        // **หมายเหตุ:** โปรดตรวจสอบว่า foreign key ใน Model 'Record' ของคุณชื่อ 'machine_id' ถูกต้อง
        await Record.destroy({
            where: { machine_id: id },
            transaction: t
        });

        // 3. อัปเดตข้อมูลเครื่องให้เป็นค่าเริ่มต้น
        const resetPayload = {
            deviceName: 'UNNAMED',
            ownerId: null // Sequelize จะแปลงเป็น owner_id ในฐานข้อมูลโดยอัตโนมัติ
        };
        const [numberOfAffectedRows] = await Machine.update(resetPayload, {
            where: { id: id },
            transaction: t
        });

        if (numberOfAffectedRows === 0) {
            // กรณีนี้ไม่ควรเกิดขึ้นเพราะเรา findByPk แล้ว แต่ใส่ไว้เพื่อความปลอดภัย
            throw new Error('รีเซ็ตข้อมูลเครื่องไม่สำเร็จ');
        }

        // 4. ถ้าทุกอย่างสำเร็จ, ยืนยันการเปลี่ยนแปลง
        await t.commit();

        return { message: 'รีเซ็ตข้อมูลเครื่องและลบ Record ที่เกี่ยวข้องสำเร็จ' };

    } catch (error) {
        // 5. หากเกิดข้อผิดพลาด, ยกเลิกการเปลี่ยนแปลงทั้งหมด
        await t.rollback();
        // ส่งต่อ error ที่เกิดขึ้นเพื่อให้ controller จัดการต่อไป
        throw new Error(error.message || 'เกิดข้อผิดพลาดระหว่างการรีเซ็ตข้อมูลเครื่อง');
    }
};


/**
 * ✅ UPDATED: รีเซ็ตข้อมูลเครื่อง (เปลี่ยนชื่อเป็น UNNAMED, ownerId เป็น null) และลบ Record ที่เกี่ยวข้องทั้งหมด
 * @param {string} id - ID ของเครื่องที่ต้องการรีเซ็ต
 * @returns {Promise<{message: string}>}
 */
const registerMachine = async (userId, deviceId, body) => {

    const { error, value } = registerMachineSchema.validate(body);
    if (error) throw new Error(`ข้อมูลไม่ถูกต้อง: ${error.details[0].message}`);

    // ใช้ transaction เพื่อให้แน่ใจว่าการดำเนินการทั้งหมด (ลบและอัปเดต) สำเร็จหรือล้มเหลวพร้อมกัน
    const t = await sequelize.transaction();
    console.log(value);
    
    try {
        // 1. ตรวจสอบว่ามีเครื่องนี้อยู่จริงหรือไม่
        const machine = await Machine.findByPk(deviceId, { transaction: t });
        if (!machine) {
            // ไม่ต้อง rollback เพราะยังไม่ได้ทำอะไร และโยน error ออกไป
            throw new Error('ไม่พบข้อมูลเครื่อง');
        }


        // 3. อัปเดตข้อมูลเครื่องให้เป็นค่าเริ่มต้น
        const resetPayload = {
            deviceName: value.deviceName ?? "MY-DEVICE",
            ownerId: userId // Sequelize จะแปลงเป็น owner_id ในฐานข้อมูลโดยอัตโนมัติ
        };
        const [numberOfAffectedRows] = await Machine.update(resetPayload, {
            where: { id: deviceId },
            transaction: t
        });

        if (numberOfAffectedRows === 0) {
            // กรณีนี้ไม่ควรเกิดขึ้นเพราะเรา findByPk แล้ว แต่ใส่ไว้เพื่อความปลอดภัย
            throw new Error('ลงทะเบียนอุปกรณ์สำเร็จ');
        }

        // 4. ถ้าทุกอย่างสำเร็จ, ยืนยันการเปลี่ยนแปลง
        await t.commit();

        return { message: 'ลงทะเบียนอุปกรณ์สำเร็จ' };

    } catch (error) {
        // 5. หากเกิดข้อผิดพลาด, ยกเลิกการเปลี่ยนแปลงทั้งหมด
        await t.rollback();
        // ส่งต่อ error ที่เกิดขึ้นเพื่อให้ controller จัดการต่อไป
        throw new Error(error.message || 'เกิดข้อผิดพลาดระหว่างการลงเบียนเครื่อง');
    }
};


module.exports = {
    createMachine,
    getAllMachines,
    getMachineById,
    updateMachine,
    deleteMachine,
    touchMachine,
    resetMachine,
    registerMachine
};