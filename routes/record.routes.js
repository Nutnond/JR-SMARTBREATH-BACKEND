// routes/record.routes.js
const verifyToken = require("../middleware/verifyToken"); 
module.exports = app => {
    const records = require("../controllers/record.controller.js");
    const router = require("express").Router();

    router.post("/", records.create);
    router.get("/",[verifyToken], records.findAll);
    router.get("/:id",[verifyToken], records.findOne);
    router.delete("/:id",[verifyToken], records.delete);
    app.use('/records', router);
};