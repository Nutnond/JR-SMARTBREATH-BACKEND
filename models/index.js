// models/index.js
const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');
dotenv.config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: process.env.DB_DIALECT,
  }
);

const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;

// โหลด Model User เข้ามาใช้งาน
db.User = require('./user.model.js')(sequelize);
db.Machine = require('./machine.model.js')(sequelize); // <-- เพิ่ม Machine
db.Record = require('./record.model.js')(sequelize);   // <-- เพิ่ม Record

// *** ตั้งค่าความสัมพันธ์ (Associations) ***
// 1. User มีได้หลาย Machine (One-to-Many)
db.User.hasMany(db.Machine, {
  foreignKey: 'owner_id',
  as: 'machines' // ตั้งชื่อเล่นสำหรับเรียกใช้งาน
});
db.Machine.belongsTo(db.User, {
  foreignKey: 'owner_id',
  as: 'owner'
});

// 2. Machine มีได้หลาย Record (One-to-Many)
db.Machine.hasMany(db.Record, {
  foreignKey: 'machine_id',
  as: 'records'
});
db.Record.belongsTo(db.Machine, {
  foreignKey: 'machine_id',
  as: 'machine'
});

module.exports = db;