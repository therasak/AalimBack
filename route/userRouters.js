const express = require('express');
const router = express.Router();
const {login, fetchCustomers, changeMonth, fetchMonths, saveCustomerPayment, uploadCustomers, addCustomer, searchCustomer, editCustomerBox, editCustomerDetails} = require('../controllers/userControler'); // ✅ import login controller


// ------------------------------------------------

router.post('/login', login);


// customer Routes
router.get('/custemersList', fetchCustomers);
router.get('/Searchcustomer', searchCustomer);
router.post('/paymentEntry', saveCustomerPayment); // Placeholder for adding customer
router.post('/uploadCustomers', uploadCustomers); // Placeholder for uploading customers via Excel
router.post('/Addcustomer', addCustomer); // add Single User
// router.post('/EditCustomer', editCustomer); // add Single User
// Month Change
router.get('/getMonths', fetchMonths);
router.post('/changeMonth', changeMonth);// Chnage Month




router.post("/EditCustomerBox", editCustomerBox);
router.post("/EditCustomerDetails", editCustomerDetails);

module.exports = router; // ✅ export router only (not a function)
