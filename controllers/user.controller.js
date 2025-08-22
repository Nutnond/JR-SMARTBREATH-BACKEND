// controllers/user.controller.js
const userService = require('../services/user.service');

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
    const user = await userService.createUser(req.body);
    res.status(201).send(user);
  } catch (error) {
    handleErrors(res, error);
  }
};

exports.findAll = async (req, res) => {
  try {
    const users = await userService.getAllUsers();
    res.status(200).send(users);
  } catch (error) {
    handleErrors(res, error);
  }
};

exports.findOne = async (req, res) => {
  try {
    if(req.userId != req.params.id) {
      return res.status(403).send({ message: "Access denied." });
    }
    const user = await userService.getUserById(req.params.id);
    res.status(200).send(user);
  } catch (error) {
    handleErrors(res, error);
  }
};

exports.update = async (req, res) => {
  try {
    if(req.userId != req.params.id){
      return res.status(403).send({ message: "Access denied." });
    }
    const updatedUser = await userService.updateUser(req.params.id, req.body);
    res.status(200).send(updatedUser);
  } catch (error) {
    handleErrors(res, error);
  }
};

exports.delete = async (req, res) => {
  try {
   if(req.userId != req.params.id) {
      return res.status(403).send({ message: "Access denied." });
    }
    const result = await userService.deleteUser(req.params.id);
    res.status(200).send(result);
  } catch (error) {
    handleErrors(res, error);
  }
};