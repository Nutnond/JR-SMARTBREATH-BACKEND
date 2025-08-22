// routes/machine.routes.js
const verifyToken = require("../middleware/verifyToken"); 
module.exports = app => {
    const machines = require("../controllers/machine.controller.js");
    const router = require("express").Router();

    router.post("/",[verifyToken], machines.create);
    router.get("/",[verifyToken], machines.findAll);
    router.get("/:id",[verifyToken], machines.findOne);
    // router.put("/:id", machines.update);
    // router.delete("/:id", machines.delete);

    app.use('/machines', router);
};