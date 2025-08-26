// services/record.service.js
const Joi = require('joi');
const { v4: uuidv4 } = require('uuid');
const { Record, Machine } = require('../models');
const { createReportPdf } = require('../services/file-result-service');

// Schema สำหรับตรวจสอบข้อมูลตอนสร้าง Record
const createRecordSchema = Joi.object({
    machineId: Joi.string().uuid().required(),
    spo2: Joi.number().integer().min(0).max(100).required(),
    fev1: Joi.number().positive().required(),
    fvc: Joi.number().positive().required(),
    pef: Joi.number().positive().required(),
    measured_at: Joi.date().optional()
});


/**
 * สร้าง Record การวัดค่าใหม่
 * @param {object} recordData - ข้อมูลสำหรับการบันทึก
 * @returns {Promise<Record>}
 */
const createRecord = async (recordData) => {
    // 1. ตรวจสอบความถูกต้องของข้อมูล
    const { error, value } = createRecordSchema.validate(recordData);
    if (error) {
        throw new Error(`ข้อมูลไม่ถูกต้อง: ${error.details[0].message}`);
    }

    // 2. ตรวจสอบว่ามีเครื่องที่ระบุอยู่จริง
    const machine = await Machine.findByPk(value.machineId);
    if (!machine) {
        throw new Error('ไม่พบข้อมูลเครื่อง');
    }

    // 3. สร้าง Record พร้อม UUID ใหม่
    return await Record.create({
        id: uuidv4(), // สร้าง UUID อัตโนมัติ
        ...value
    });
};

/**
 * ดึง Record ทั้งหมดแบบแบ่งหน้า (Paginated) และสามารถกรองตาม machineId ได้
 * @param {string} machineId - ID ของเครื่อง
 * @param {object} options - ตัวเลือกสำหรับ pagination และการกรอง
 * @returns {Promise<object>}
 */
const getRecordsPaginated = async (machineId, { page, pageSize, sortBy, order, from, to }) => {
    const offset = (page - 1) * pageSize;

    const where = { machineId };

    // กรองตามช่วงเวลา
    if (from || to) {
        where.timestamp = {};
        if (from) where.timestamp[Op.gte] = from;
        if (to) where.timestamp[Op.lte] = to;
    }

    const { rows, count } = await Record.findAndCountAll({
        where,
        offset,
        limit: pageSize,
        order: [[sortBy, order.toUpperCase()]],
    });

    const totalCount = count;
    const totalPages = Math.max(Math.ceil(totalCount / pageSize), 1);

    return {
        page,
        pageSize,
        totalPages,
        totalCount,
        hasNext: page < totalPages,
        hasPrev: page > 1,
        items: rows,
    };
};

/**
 * ดึงข้อมูล Record เดียวด้วย ID
 * @param {string} id - ID ของ Record
 * @returns {Promise<Record>}
 */
const getRecordById = async (id) => {
    const record = await Record.findByPk(id, {
        include: [{ model: Machine, as: 'machine' }] // ดึงข้อมูลเครื่องที่เกี่ยวข้องมาด้วย
    });

    if (!record) {
        throw new Error('ไม่พบข้อมูลการวัดผล');
    }
    return record;
};

/**
 * ลบข้อมูล Record
 * @param {string} id - ID ของ Record ที่ต้องการลบ
 * @returns {Promise<{message: string}>}
 */
const deleteRecord = async (id) => {
    const num = await Record.destroy({
        where: { id: id }
    });

    if (num === 0) {
        throw new Error('ไม่พบข้อมูลการวัดผล');
    }
    return { message: 'ลบข้อมูลการวัดผลสำเร็จ' };
};
 
module.exports = {
    createRecord,
    getRecordsPaginated,
    getRecordById,
    deleteRecord
};