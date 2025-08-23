// controllers/record.controller.js
const recordService = require('../services/record.service');
const machineService = require('../services/machine.service');
const handleErrors = (res, error) => {
  // 👇 เพิ่มบรรทัดนี้เข้าไป
  console.error("!!! SERVER ERROR DETAILS:", error); 

  const message = error.message;
  if (message.includes('Validation error')) return res.status(400).send({ message });
  if (message.includes('already in use') || message.includes('already taken')) return res.status(409).send({ message });
  if (message.includes('not found')) return res.status(404).send({ message });
  
  // ปรับแก้ข้อความที่ส่งกลับไป เพื่อให้รู้ว่าต้องดูที่ log
  return res.status(500).send({ 
    message: "An unexpected error occurred. Please check server logs.",
    // อาจจะส่ง error message กลับไปด้วยเพื่อช่วยดีบัก
    error: message 
  });
};

exports.create = async (req, res) => {
  try {
    const { machineId, spo2, fev1, fvc, pef } = req.body;
    if (!machineId || !spo2 || !fev1 || !fvc || !pef) {
      return res.status(400).send({ message: "All fields are required!" });
    }
    const record = await recordService.createRecord(req.body);
    const machine = await machineService.touchMachine(machineId)
    res.status(201).send(record);
  } catch (error) {
    handleErrors(res, error);
  }
};

exports.findOne = async (req, res) => {
  try {
    const recordId = req.params.id;

    // 1. เรียก Service เพื่อดึงข้อมูล Record จาก ID
    const record = await recordService.getRecordById(recordId);

    // 2. ตรวจสอบว่ามี Record นี้อยู่จริงหรือไม่
    if (!record) {
      return res.status(404).send({ message: "Record not found." });
    }

    // 3. ✅ การตรวจสอบสิทธิ์ (Authorization)
    // - ดึงข้อมูลเครื่องจาก machineId ที่อยู่ใน record
    // - ตรวจสอบว่าเจ้าของเครื่องตรงกับ user ที่ login อยู่หรือไม่
    const machine = await machineService.getMachineById(record.machineId);
    
    if (!machine || machine.ownerId !== req.userId) {
      return res.status(403).send({ message: "Forbidden: You can only view records for your own machines." });
    }

    // 4. ถ้าทุกอย่างถูกต้อง ให้ส่งข้อมูลกลับไป
    res.status(200).send(record);
    
  } catch (error) {
    handleErrors(res, error);
  }
};

// controllers/record.controller.js

exports.findAll = async (req, res) => {
  try {
    const { machineId } = req.query;
    if (!machineId) {
      return res.status(400).send({ message: "Query parameter 'machineId' is required." });
    }

    // ตรวจสอบเครื่อง + สิทธิ์เจ้าของ
    const machine = await machineService.getMachineById(machineId);
    if (!machine) return res.status(404).send({ message: "Machine not found." });
    if (machine.ownerId !== req.userId) {
      return res.status(403).send({ message: "Forbidden: You can only view records for your own machines." });
    }

    // ---- Pagination & Filters ----
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const pageSizeRaw = parseInt(req.query.pageSize, 10) || 10;
    const pageSize = Math.min(Math.max(pageSizeRaw, 1), 100);

    // ✅ UPDATED: อัปเดตรายการฟิลด์ที่สามารถ Sort ได้ตาม Model
    // เพิ่ม 'measuredAt' และ 'updatedAt' เข้ามา และลบ 'fev1Fvc' (เนื่องจากเป็น generated field)
    const allowedSort = new Set(['measuredAt', 'createdAt', 'updatedAt', 'spo2', 'fev1', 'fvc', 'pef', 'id']);
    
    // ✅ UPDATED: เปลี่ยนค่า Default Sort เป็น 'measuredAt' ซึ่งเหมาะสมกว่า
    const sortBy = allowedSort.has(req.query.sortBy) ? req.query.sortBy : 'measuredAt';
    const order = (req.query.order || 'desc').toLowerCase() === 'asc' ? 'asc' : 'desc';

    // กรองช่วงเวลา (ถ้ามี) รองรับ ISO string หรือ yyyy-MM-dd
    const from = req.query.from ? new Date(req.query.from) : null;
    const to = req.query.to ? new Date(req.query.to) : null;

    // เรียก service แบบแบ่งหน้า
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

