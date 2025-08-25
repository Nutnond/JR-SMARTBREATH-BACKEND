// routes/auth.routes.js
module.exports = app => {
    const auth = require("../controllers/auth.controller.js");
    const router = require("express").Router();

    router.post("/login", auth.login);
    router.post("/register",auth.register)
    app.use('/auth', router);
    
};