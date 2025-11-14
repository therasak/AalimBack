const User = require('../models/User');
const CustomerModel = require('../models/Customers');
const YearMonthModel = require('../models/YearMonth');
const EntryReportModel = require('../models/EntryReport');
//-------------------------------------------------
// User Login 


const login = async (req, res) => {
  console.log("HGVGVg");

  const {userId, password} = req.body;

  const isUser = await User.findOne({userId});

  if (!isUser) {
    return res.status(404).json({message: 'User not found'});
  }

  if (isUser.password !== password) {
    return res.status(401).json({message: 'Incorrect password'});
  }

  res.json({message: 'Success', user: isUser});
};



///   ---------------------------------------------- Month Controllers --------------------------------------
// fetch Months

const fetchMonths = async (req, res) => {
  try {
    const months = await YearMonthModel.find({});
    const currentMonth = months.find(month => month.active === 1);
    res.status(200).json({months: months, currentMonth: currentMonth});
  }
  catch (error) {
    res.status(500).json({message: 'Server Error'});
  }

};
//-----------------------------------------------
// Month Change

const changeMonth = async (req, res) => {
  const {selectedMonth} = req.body;

  try {
    const currentMonth = await YearMonthModel.updateOne({active: 1}, {$set: {active: 0}});
    const changeMonth = await YearMonthModel.findOneAndUpdate(
      {month: selectedMonth.trim()},
      {$set: {active: 1}},
    );
    console.log(changeMonth)
    res.status(200).json({message: 'Month changed successfully', changeMonth});
  } catch (error) {
    res.status(500).json({message: 'Server Error'});
  }
};



/// -------------------------------------------------------------  Customer Controllers -----------------------------
//-------------------------------------------------
//Fetch Customers
const fetchCustomers = async (req, res) => {
  try {
    // console.log("Fetching customers...");

    // Step 1: Get the currently active month
    const currentMonth = await YearMonthModel.findOne({active: 1});
    if (!currentMonth) {
      return res.status(404).json({message: "No active month found"});
    }

    // console.log("Current Month:", currentMonth.month);

    // Step 2: Get all customers
    const allCustomers = await CustomerModel.find({});

    // Step 3: Get all entries for the current month
    const monthEntries = await EntryReportModel.find({
      month: currentMonth.month
    });

    // Step 4: Collect all box numbers already in the entry report for that month
    const enteredBoxes = new Set(monthEntries.map(e => e.boxNumber));

    // Step 5: Filter customers — include only those NOT in enteredBoxes
    const pendingCustomers = allCustomers.filter(
      c => !enteredBoxes.has(c.boxNumber)
    );

    // Step 6: Send filtered customers
    res.status(200).json({customers: pendingCustomers});
  } catch (error) {
    console.error("Error in fetchCustomers:", error);
    res.status(500).json({message: "Server Error"});
  }
};



// -------------------------------------------------------------
// Save Customer Payment

const saveCustomerPayment = async (req, res) => {

  const today = new Date();
  const formattedDate = today.toISOString().split('T')[0];
  const currentMonth = await YearMonthModel.findOne({active: 1});
  const {boxNumber, cardNumber, amount} = req.body;
  try {
    const newEntry = new EntryReportModel({
      boxNumber,
      amount,
      cardNumber,
      month: currentMonth.month,
      day: formattedDate,
      paid: "paid",
    });
    await newEntry.save();
    res.status(200).json({message: 'Payment saved successfully', newEntry});
  } catch (error) {
    res.status(500).json({message: 'Server Error'});
  }
};


// -------------------------------------------------------------
// Upload Customers via Excel
// const CustomerModel = require('../models/Customer');

const uploadCustomers = async (req, res) => {
  const {data} = req.body;

  if (!Array.isArray(data) || data.length === 0) {
    return res.status(400).json({message: "No data found to upload"});
  }

  try {
    const allowedFields = [
      "customerName",
      "cardNumber",
      "boxNumber",
      "phoneNumber",
      "street",
      "company",
      "status",
    ];

    // Filter + Convert all fields to strings
    const filteredData = data.map((item) => {
      const obj = {};
      for (const key of allowedFields) {
        if (item[key] !== undefined && item[key] !== null) {
          obj[key] = String(item[key]).trim(); // convert everything to string
        }
      }
      return obj;
    });

    // Insert into MongoDB
    await CustomerModel.insertMany(filteredData);
    res.status(200).json({message: "Customers uploaded successfully"});
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({message: "Server error"});
  }
};

// module.exports = {uploadCustomers};


// -------------------------------------------------------------
// Add Single Customer
const addCustomer = async (req, res) => {
  const {customerName, cardNumber, boxNumber, phoneNumber, street, company, status} = req.body;
  try {
    const existingCustomer = await CustomerModel.findOne({$or: [{cardNumber}, {boxNumber}]});
    if (existingCustomer) {
      return res.status(400).json({message: 'Customer with the same card number or box number already exists'});
    }

    const newCustomer = new CustomerModel({
      customerName,
      cardNumber,
      boxNumber,
      phoneNumber,
      street,
      company,
      status: status || "Active",
    });

    // console.log(newCustomer);

    const savedCustomer = await newCustomer.save();
    // console.log(savedCustomer);

    res.status(200).json({message: 'Customer added successfully', newCustomer: savedCustomer});
  } catch (error) {
    console.error(error);  // Log full error for debugging
    res.status(500).json({message: 'Server Error'});
  }
};



// -------------------------------------------------------------
// Search Customer

const searchCustomer = async (req, res) => {
  const {searchValue} = req.query;
  console.log(searchValue);

  try {
    const customer = await CustomerModel.findOne({cardNumber: searchValue});

    if (!customer) {
      return res.status(404).json({message: "Customer not found"});
    }

    res.status(200).json(customer);

  } catch (error) {
    res.status(500).json({message: "Server Error"});
  }
};


// -------------------------------------------------------------
// Edit Customer

// const editCustomer = async (req, res) => {
//   const {customerName, cardNumber, boxNumber, phoneNumber, street, company, status} = req.body;
//   console.log(req.body)
//   try {
//     const checkBoxNumber = await CustomerModel.find({boxNumber: boxNumber})
//     console.log(checkBoxNumber)
//     if (checkBoxNumber.length > 0) {
//       return res.status(400).json({message: 'Box Number already exists'});
//     }
//     const updatedCustomer = await CustomerModel.findOneAndUpdate(
//       {cardNumber: cardNumber},
//       {
//         $set: {
//           customerName,
//           boxNumber,
//           phoneNumber,
//           street,
//           company,
//           status: status || "Active",
//         }
//       },
//     );
//     res.status(200).json({message: 'Customer updated successfully', updatedCustomer});
//   }
//   catch (error) {
//     console.error(error);  // Log full error for debugging
//     res.status(500).json({message: 'Server Error'});
//   }
// };




//--------------------------------------------------


const editCustomerBox = async (req, res) => {
  const {cardNumber, boxNumber} = req.body;
  try {
    const exists = await CustomerModel.findOne({boxNumber});
    if (exists) {
      return res.status(400).json({message: "Box Number already exists"});
    }
    const updated = await CustomerModel.findOneAndUpdate(
      {cardNumber},
      {$set: {boxNumber}},
      {new: true}
    );
    if (!updated) {
      return res.status(404).json({message: "Customer not found"});
    }
    res.status(200).json({message: "Box Number updated successfully", updated});
  } catch (err) {
    console.error(err);
    res.status(500).json({message: "Server Error"});
  }
};


const editCustomerDetails = async (req, res) => {
  const {cardNumber, customerName, phoneNumber, street, company, status} = req.body;
  try {
    const updated = await CustomerModel.findOneAndUpdate(
      {cardNumber},
      {
        $set: {
          customerName,
          phoneNumber,
          street,
          company,
          status: status || "Active",
        },
      },
      {new: true}
    );
    if (!updated) {
      return res.status(404).json({message: "Customer not found"});
    }
    res.status(200).json({message: "Other details updated successfully", updated});
  } catch (err) {
    console.error(err);
    res.status(500).json({message: "Server Error"});
  }
};


module.exports = {
  login,
  fetchCustomers, fetchMonths, changeMonth, saveCustomerPayment, uploadCustomers, addCustomer, searchCustomer, editCustomerBox, editCustomerDetails
};
