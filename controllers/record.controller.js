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
    res.status(201).send(record);
  } catch (error) {
    handleErrors(res, error);
  }
};

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
    const pageSize = Math.min(Math.max(pageSizeRaw, 1), 100); // กันยิงหนักเกิน

    const allowedSort = new Set(['timestamp', 'spo2', 'fev1', 'fvc', 'pef', 'fev1_fvc', 'id']);
    const sortBy = allowedSort.has(req.query.sortBy) ? req.query.sortBy : 'timestamp';
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

