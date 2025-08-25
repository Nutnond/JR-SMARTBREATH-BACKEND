// controllers/record.controller.js
const recordService = require('../services/record.service');
const machineService = require('../services/machine.service');

/**
 * ฟังก์ชันกลางสำหรับจัดการข้อผิดพลาดและส่ง response กลับไป
 */
const handleErrors = (res, error) => {
    console.error("!!! รายละเอียดข้อผิดพลาด:", error);

    const message = error.message;
    // ตรวจจับข้อความ error ที่มาจาก service (ซึ่งเป็นภาษาไทยแล้ว)
    if (message.includes('ข้อมูลไม่ถูกต้อง')) return res.status(400).send({ message });
    if (message.includes('ไม่พบข้อมูล')) return res.status(404).send({ message });
    
    // Error อื่นๆ ที่ไม่คาดคิด
    return res.status(500).send({ 
        message: "เกิดข้อผิดพลาดที่ไม่คาดคิด กรุณาตรวจสอบ log ของเซิร์ฟเวอร์",
        error: message 
    });
};

/**
 * สร้างบันทึกการวัดผลใหม่
 */
exports.create = async (req, res) => {
    try {
        const { machineId, spo2, fev1, fvc, pef } = req.body;
        if (!machineId || !spo2 || !fev1 || !fvc || !pef) {
            return res.status(400).send({ message: "กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน" });
        }
        const record = await recordService.createRecord(req.body);
        // อัปเดตเวลาล่าสุดของเครื่อง
        await machineService.touchMachine(machineId);
        res.status(201).send(record);
    } catch (error) {
        handleErrors(res, error);
    }
};

/**
 * ดึงข้อมูลการวัดผลด้วย ID
 */
exports.findOne = async (req, res) => {
    try {
        const recordId = req.params.id;

        const record = await recordService.getRecordById(recordId);

        // ✅ การตรวจสอบสิทธิ์ (Authorization)
        // ตรวจสอบว่าเจ้าของเครื่องตรงกับ user ที่ login อยู่หรือไม่
        const machine = await machineService.getMachineById(record.machineId);
        
        if (machine.ownerId !== req.userId) {
            return res.status(403).send({ message: "คุณไม่มีสิทธิ์ดูข้อมูลการวัดผลของเครื่องอื่น" });
        }

        res.status(200).send(record);
        
    } catch (error) {
        // getRecordById อาจ throw 'ไม่พบข้อมูลการวัดผล' ซึ่ง handleErrors จัดการได้
        handleErrors(res, error);
    }
};

/**
 * ดึงข้อมูลการวัดผลทั้งหมดของเครื่องที่ระบุ (แบบแบ่งหน้า)
 */
exports.findAll = async (req, res) => {
    try {
        const { machineId } = req.query;
        if (!machineId) {
            return res.status(400).send({ message: "จำเป็นต้องระบุ 'machineId' ใน query parameter" });
        }

        // ตรวจสอบเครื่อง + สิทธิ์เจ้าของ
        const machine = await machineService.getMachineById(machineId);
        if (machine.ownerId !== req.userId) {
            return res.status(403).send({ message: "คุณไม่มีสิทธิ์ดูข้อมูลการวัดผลของเครื่องอื่น" });
        }

        // ---- Pagination & Filters ----
        const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
        const pageSizeRaw = parseInt(req.query.pageSize, 10) || 10;
        const pageSize = Math.min(Math.max(pageSizeRaw, 1), 100);

        const allowedSort = new Set(['measuredAt', 'createdAt', 'updatedAt', 'spo2', 'fev1', 'fvc', 'pef', 'id']);
        const sortBy = allowedSort.has(req.query.sortBy) ? req.query.sortBy : 'measuredAt';
        const order = (req.query.order || 'desc').toLowerCase() === 'asc' ? 'asc' : 'desc';
        
        const from = req.query.from ? new Date(req.query.from) : null;
        const to = req.query.to ? new Date(req.query.to) : null;

        const result = await recordService.getRecordsPaginated(machineId, {
            page,
            pageSize,
            sortBy,
            order,
            from,
            to,
        });

        res.send(result);
    } catch (error) {
        handleErrors(res, error);
    }
};


/**
 * ลบข้อมูลการวัดผล (Record)
 */
exports.delete = async (req, res) => {
    try {
        // 1. ดึง ID ของ record ที่จะลบจาก URL params
        const recordId = req.params.id;

        // 2. ตรวจสอบสิทธิ์ความเป็นเจ้าของก่อนทำการลบ
        //    - ดึงข้อมูล record เพื่อหา machineId
        const recordToDelete = await recordService.getRecordById(recordId);
        //    - ดึงข้อมูล machine เพื่อหา ownerId
        const machine = await machineService.getMachineById(recordToDelete.machineId);
        
        //    - เปรียบเทียบ ownerId กับ userId ของผู้ที่ login อยู่
        if (machine.ownerId !== req.userId) {
            return res.status(403).send({ message: "คุณไม่มีสิทธิ์ลบข้อมูลนี้" });
        }

        // 3. ถ้ามีสิทธิ์ ให้เรียก service เพื่อลบข้อมูล
        const result = await recordService.deleteRecord(recordId);
        
        // 4. ส่งผลลัพธ์การลบกลับไป (ซึ่งจะมี message บอกว่าลบสำเร็จ)
        res.status(200).send(result);

    } catch (error) {
        // หากเกิดข้อผิดพลาด (เช่นหา record ไม่เจอ) ให้ส่งไปที่ error handler
        handleErrors(res, error);
    }
};

