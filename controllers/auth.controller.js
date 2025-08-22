// controllers/auth.controller.js
const authService = require('../services/auth.service');

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).send({ message: "Username and password are required." });
    }

    const result = await authService.login(username, password);
    res.send(result);

  } catch (error) {
    res.status(401).send({ message: error.message || "Authentication failed." });
  }
};