// routes/user.routes.js
const verifyToken = require("../middleware/verifyToken"); // <-- นำเข้า Middleware

module.exports = app => {
    const users = require("../controllers/user.controller.js");
    const router = require("express").Router();

    // Route นี้ไม่ต้อง login ก็สร้าง user ได้
    router.post("/", users.create);

    // Route พวกนี้ต้องมี token ที่ถูกต้องถึงจะเข้าได้
    // router.get("/", [verifyToken], users.findAll);
    router.get("/:id", [verifyToken], users.findOne);
    router.put("/:id", [verifyToken], users.update);
    router.delete("/:id", [verifyToken], users.delete);

    app.use('/users', router);
};