// server.js
const express = require('express');
const dotenv = require('dotenv');
const db = require('./models');

dotenv.config();

const app = express();

// Middlewares: แปลง request body ให้เป็น JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Test Route
app.get('/', (req, res) => {
  res.json({ message: 'API Server is running!' });
});

// นำ Routes มาใช้งาน
require("./routes/user.routes")(app);
require("./routes/machine.routes")(app);
require("./routes/record.routes")(app);  
require("./routes/auth.routes")(app);

const PORT = process.env.PORT || 8080;

// เชื่อมต่อฐานข้อมูลและเริ่มรันเซิร์ฟเวอร์
db.sequelize.sync({ force: false }) // force: false = จะไม่ลบและสร้างตารางใหม่ทุกครั้งที่รัน
  .then(() => {
    console.log("Database connected and synced.");
    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to sync database: ", err);
  });