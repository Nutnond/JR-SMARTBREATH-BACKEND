// controllers/record.controller.js
const recordService = require('../services/record.service');
const machineService = require('../services/machine.service');
const { createReportPdf } = require('../services/file-result-service');
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
        const username = req.username
        const record = await recordService.getRecordById(recordId);

        // ✅ การตรวจสอบสิทธิ์ (Authorization)
        // ตรวจสอบว่าเจ้าของเครื่องตรงกับ user ที่ login อยู่หรือไม่
        const machine = await machineService.getMachineById(record.machineId);
        const isClient = username == "CLIENT_TOKEN"
        if (machine.ownerId !== req.userId && !isClient) {
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
        const username = req.username
        const { machineId } = req.query;
        if (!machineId) {
            return res.status(400).send({ message: "จำเป็นต้องระบุ 'machineId' ใน query parameter" });
        }

        // ตรวจสอบเครื่อง + สิทธิ์เจ้าของ
        const machine = await machineService.getMachineById(machineId);
        const isClient = username == "CLIENT TOKEN"


        if (machine.ownerId !== req.userId && !isClient) {
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


// controllers/record.controller.js

// controllers/record.controller.js

exports.downloadReport = async (req, res) => {
    try {

        // --- 1. ดึงข้อมูลผู้ใช้ที่ล็อกอิน และ ID ของ Record ที่ต้องการ ---
        const currentUser = req.userId // สมมติว่า verifyToken เก็บข้อมูล user ไว้ที่นี่
        const recordId = req.params.id;

        // 🎯 NEW: ดึงข้อมูลผู้รับรายงานจาก Body
        const { patientInfo } = req.body; 

        // --- 2. ดึงข้อมูล Record พร้อมข้อมูลเจ้าของ ---
        const recordData = await recordService.getRecordById(recordId);

        // --- 3. ตรวจสอบสิทธิ์การเข้าถึง ---
        // `recordData.machine.ownerId` คือ ID ของเจ้าของเครื่องที่ผูกกับ Record นี้
        const isOwner = recordData.machine.ownerId === currentUser
        // ถ้าไม่ใช่เจ้าของ ให้ปฏิเสธการเข้าถึง
        if (!isOwner) {
            return res.status(403).send({
                message: "คุณไม่มีสิทธิ์เข้าถึงข้อมูลนี้ (Forbidden)"
            });
        }
        
        // 🎯 NEW: VALIDATION สำหรับ patientInfo
        if (!patientInfo || !patientInfo.name || !patientInfo.age || !patientInfo.gender || !patientInfo.height || !patientInfo.weight) {
             return res.status(400).send({
                message: "ข้อมูลผู้รับรายงาน (patientInfo) ไม่ครบถ้วนหรือไม่ถูกต้อง กรุณากรอก ชื่อ, อายุ, เพศ, ส่วนสูง, น้ำหนัก"
            });
        }
        
        // 🎯 NEW: VALIDATION สำหรับชนิดข้อมูล (ตรวจสอบตัวเลข)
        const age = parseInt(patientInfo.age);
        const height = parseInt(patientInfo.height);
        const weight = parseInt(patientInfo.weight);

        if (isNaN(age) || isNaN(height) || isNaN(weight) || age <= 0 || height <= 0 || weight <= 0) {
            return res.status(400).send({
                message: "ข้อมูล อายุ, ส่วนสูง, น้ำหนัก ต้องเป็นตัวเลขที่ถูกต้องและมากกว่าศูนย์"
            });
        }

        const reportConfig = {
            record: recordData,
            patientInfo: {
                name: patientInfo.name,
                age: age,
                gender: patientInfo.gender,
                height: height,
                weight: weight
            }, // ใช้ patientInfo จาก body ที่ผ่านการตรวจสอบแล้ว
            // สามารถเพิ่มข้อมูล user ที่ login เช่น req.user.name, req.user.email ได้ที่นี่
        };


        // --- 4. ถ้ามีสิทธิ์ ให้สร้างและส่ง PDF ตามปกติ ---
        const pdfBuffer = await createReportPdf(reportConfig);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=report-${recordId}.pdf`);

        res.send(pdfBuffer);

    } catch (error) {
        // จัดการข้อผิดพลาดตามที่กำหนดใน handleErrors
        handleErrors(res, error);
    }
};