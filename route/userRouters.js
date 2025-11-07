const express = require('express');
const router = express.Router();
const { login } = require('../controllers/userControler'); // ✅ import login controller

router.post('/login', login); // ✅ POST route

module.exports = router; // ✅ export router only (not a function)
