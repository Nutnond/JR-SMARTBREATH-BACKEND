// controllers/machine.controller.js
const machineService = require('../services/machine.service');

const handleErrors = (res, error) => {
    console.error("!!! SERVER ERROR DETAILS:", error); // Log the error details for debugging
  const message = error.message;
  if (message.includes('Validation error')) return res.status(400).send({ message });
  if (message.includes('already taken')) return res.status(409).send({ message });
  if (message.includes('not found')) return res.status(404).send({ message });
  return res.status(500).send({ message: "An unexpected error occurred." });
};

exports.create = async (req, res) => {
  try {
    const machine = await machineService.createMachine(req.body);
    res.status(201).send(machine);
  } catch (error) {
    handleErrors(res, error);
  }
};

// controllers/machine.controller.js

exports.findAll = async (req, res) => {
  try {
    // บังคับให้ใช้ ID ของผู้ใช้ที่ login อยู่เสมอ เพื่อความปลอดภัย
    // ไม่เปิดให้ดูข้อมูลของคนอื่นได้โดยการเปลี่ยน query param
    const ownerId = req.userId; 
    
    const machines = await machineService.getAllMachines(ownerId);
    res.status(200).send(machines);
  } catch (error) {
    handleErrors(res, error); // สมมติว่ามีฟังก์ชัน handleErrors อยู่
  }
};

// controllers/machine.controller.js

exports.findOne = async (req, res) => {
  try {
    const machine = await machineService.getMachineById(req.params.id);

    if (!machine) {
        return res.status(404).send({ message: "Machine not found." });
    }

    // --- 🔐 ตรวจสอบความเป็นเจ้าของ ---
    if (machine.ownerId !== req.userId) {
        return res.status(403).send({ message: "Forbidden: You do not have permission to access this resource." });
    }
    // --- สิ้นสุดการตรวจสอบ ---

    res.status(200).send(machine);
  } catch (error) {
    handleErrors(res, error);
  }
};

// controllers/machine.controller.js

exports.update = async (req, res) => {
  try {
    const machineId = req.params.id;
    
    // 1. ดึงข้อมูลเครื่องเพื่อตรวจสอบก่อน
    const machineToUpdate = await machineService.getMachineById(machineId);

    if (!machineToUpdate) {
        return res.status(404).send({ message: "Machine not found." });
    }

    // 2. --- 🔐 ตรวจสอบความเป็นเจ้าของ ---
    if (machineToUpdate.ownerId !== req.userId) {
        return res.status(403).send({ message: "Forbidden: You do not have permission to modify this resource." });
    }
    // --- สิ้นสุดการตรวจสอบ ---

    // 3. ถ้าเป็นเจ้าของจริง จึงทำการอัปเดต
    const updatedMachine = await machineService.updateMachine(machineId, req.body);
    res.status(200).send(updatedMachine);

  } catch (error) {
    handleErrors(res, error);
  }
};

// controllers/machine.controller.js

exports.delete = async (req, res) => {
  try {
    const machineId = req.params.id;

    // 1. ดึงข้อมูลเครื่องที่จะลบเพื่อตรวจสอบก่อน
    const machineToDelete = await machineService.getMachineById(machineId);

    if (!machineToDelete) {
      return res.status(404).send({ message: "Machine not found." });
    }

    // 2. --- 🔐 ตรวจสอบความเป็นเจ้าของ ---
    if (machineToDelete.ownerId !== req.userId) {
      return res.status(403).send({ message: "Forbidden: You do not have permission to delete this resource." });
    }
    // --- สิ้นสุดการตรวจสอบ ---

    // 3. ถ้าเป็นเจ้าของจริง จึงทำการลบ
    const result = await machineService.deleteMachine(machineId);
    res.status(200).send({ message: "Machine deleted successfully." });

  } catch (error) {
    handleErrors(res, error); // สมมติว่ามีฟังก์ชัน handleErrors อยู่
  }
};