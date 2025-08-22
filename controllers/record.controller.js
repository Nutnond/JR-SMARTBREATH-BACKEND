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

    // 2. ตรวจสอบว่ามีการส่ง machineId มาหรือไม่
    if (!machineId) {
      return res.status(400).send({ message: "Query parameter 'machineId' is required." });
    }

    // 3. ดึงข้อมูลเครื่องเพื่อตรวจสอบความเป็นเจ้าของ
    const machine = await machineService.getMachineById(machineId);
    
    if (!machine) {
        return res.status(404).send({ message: "Machine not found." });
    }

    // 4. --- 🔐 ตรวจสอบสิทธิ์ ---
    // เช็คว่าผู้ใช้ที่ login เป็นเจ้าของเครื่องนี้หรือไม่
    if (machine.ownerId !== req.userId) {
        return res.status(403).send({ message: "Forbidden: You can only view records for your own machines." });
    }
    // --- สิ้นสุดการตรวจสอบ ---

    // 5. ถ้าเป็นเจ้าของจริง จึงดึงข้อมูล Record
    const records = await recordService.getAllRecords(machineId);
    res.send(records);

  } catch (error) {
    handleErrors(res, error); // สมมติว่ามีฟังก์ชัน handleErrors อยู่
  }
};

// findOne, update, delete สามารถทำในลักษณะเดียวกัน
// ...