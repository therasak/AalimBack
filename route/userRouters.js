const express = require('express');
const router = express.Router();
const {login, fetchCustomers, changeMonth, fetchMonths, saveCustomerPayment,uploadCustomers} = require('../controllers/userControler'); // ✅ import login controller


// ------------------------------------------------

router.post('/login', login);


// customer Routes
router.get('/custemersList', fetchCustomers);
router.post('/paymentEntry', saveCustomerPayment); // Placeholder for adding customer
router.post('/uploadCustomers', uploadCustomers); // Placeholder for uploading customers via Excel

// Month Change
router.get('/getMonths', fetchMonths);
router.post('/changeMonth', changeMonth);// Chnage Month


module.exports = router; // ✅ export router only (not a function)
