// routes/machine.routes.js
const verifyToken = require("../middleware/verifyToken");
module.exports = app => {
    const machines = require("../controllers/machine.controller.js");
    const router = require("express").Router();

    // routes/machine.routes.js

    // ✅ POST และ GET สำหรับ collection
    router.post("/", [verifyToken], machines.create);
    router.get("/", [verifyToken], machines.findAll);

    // ✅ วาง route ที่เฉพาะเจาะจง ('/reset/:id') ก่อน route ทั่วไป ('/:id')
    router.delete("/reset/:id", [verifyToken], machines.reset);
    router.post("/register/:id",[verifyToken],machines.register)

    // ✅ Routes ที่ทำงานกับ ID เฉพาะเจาะจง
    router.get("/:id", [verifyToken], machines.findOne);
    router.put("/:id", [verifyToken], machines.update);
    router.delete("/:id", [verifyToken], machines.delete);


    app.use('/machines', router);
};