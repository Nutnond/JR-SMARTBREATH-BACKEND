// services/record.service.js
const Joi = require('joi');
const { v4: uuidv4 } = require('uuid');
const { Record, Machine } = require('../models'); // Import Machine model มาด้วย

// Validation Schema สำหรับการสร้าง Record
const createRecordSchema = Joi.object({
    machineId: Joi.string().uuid().required(),
    spo2: Joi.number().integer().min(0).max(100).required(),
    fev1: Joi.number().positive().required(),
    fvc: Joi.number().positive().required(),
    pef: Joi.number().positive().required(),
    // measured_at ไม่ต้อง validate เพราะมีค่า default ใน DB
    measured_at: Joi.date().optional()
});


/**
 * สร้าง Record การวัดค่าใหม่
 */
const createRecord = async (recordData) => {
    // 1. Validate input
    const { error, value } = createRecordSchema.validate(recordData);
    if (error) {
        throw new Error(`Validation error: ${error.details[0].message}`);
    }

    // 2. Check if the machine exists
    const machine = await Machine.findByPk(value.machineId);
    if (!machine) {
        throw new Error('Machine not found.');
    }

    // 3. Create the record with a new UUID
    return await Record.create({
        id: uuidv4(), // สร้าง UUID อัตโนมัติ
        ...value
    });
};

/**
 * ดึง Record ทั้งหมด โดยอาจกรองตาม machineId
 */
const getAllRecords = async (machineId) => {
    const condition = machineId ? { machine_id: machineId } : null;
    return await Record.findAll({
        where: condition,
        order: [['measured_at', 'DESC']], // เรียงตามวันที่วัดล่าสุด
        include: [{ // ดึงข้อมูลเครื่องมาด้วย
            model: Machine,
            as: 'machine',
            attributes: ['id', 'device_name']
        }]
    });
};

/**
 * ดึงข้อมูล Record เดียวด้วย ID
 */
const getRecordById = async (id) => {
    const record = await Record.findByPk(id, {
        include: [{ model: Machine, as: 'machine' }] // ดึงข้อมูลเครื่องมาด้วย
    });

    if (!record) {
        throw new Error('Record not found.');
    }
    return record;
};

/**
 * ลบข้อมูล Record
 */
const deleteRecord = async (id) => {
    const num = await Record.destroy({
        where: { id: id }
    });

    if (num === 0) {
        throw new Error('Record not found.');
    }
    return { message: 'Record deleted successfully.' };
};


module.exports = {
    createRecord,
    getAllRecords,
    getRecordById,
    deleteRecord, // เพิ่มฟังก์ชัน delete เข้าไป
};