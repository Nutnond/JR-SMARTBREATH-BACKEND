// middleware/verifyToken.js
const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  // ดึง token จาก header 'Authorization' (รูปแบบ: "Bearer <token>")
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(403).send({ message: "No token provided!" });
  }

  const token = authHeader.split(' ')[1];

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: "Unauthorized! Invalid Token." });
    }
    // ถ้า token ถูกต้อง, เก็บข้อมูล user ที่ถอดรหัสแล้วไว้ใน request
    req.userId = decoded.id;
    req.username = decoded.username;
    next(); // ไปยังด่านต่อไป (Controller)
  });
};

module.exports = verifyToken;