// const User = require('../models/User');

const CustomerModel = require('../models/Customers');
const YearMonthModel = require('../models/YearMonth');
const EntryReportModel = require('../models/EntryReport');
const XLSX = require('xlsx');
const ExcelJS = require('exceljs');
const UserModel = require('../models/User')


//-------------------------------------------------
// User Login 


const login = async (req, res) => {
  // console.log("HGVGVg");

  const isUser = await UserModel.findOne({userId: req.body.userid});

  // console.log(isUser)

  if (!isUser) {
    return res.status(404).json({message: 'User not found'});
  }

  if (isUser.password !== req.body.password) {
    return res.status(401).json({message: 'Incorrect password'});
  }

  res.status(200).json({message: 'Success', user: isUser});
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
    const allCustomers = await CustomerModel.find({status: 'Active'});

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

    // Check for duplicates and filter out existing customers
    const customersToAdd = [];
    const duplicates = [];

    for (const customer of filteredData) {
      const existingCustomer = await CustomerModel.findOne({
        $or: [
          {cardNumber: customer.cardNumber},
          {boxNumber: customer.boxNumber}
        ]
      });

      if (existingCustomer) {
        duplicates.push({
          cardNumber: customer.cardNumber,
          boxNumber: customer.boxNumber,
          reason: 'Card number or box number already exists'
        });
      } else {
        customersToAdd.push(customer);
      }
    }

    // Insert only non-duplicate customers into MongoDB
    let insertedCount = 0;
    if (customersToAdd.length > 0) {
      await CustomerModel.insertMany(customersToAdd);
      insertedCount = customersToAdd.length;
    }

    res.status(200).json({
      message: `Customers uploaded successfully`,
      insertedCount: insertedCount,
      duplicateCount: duplicates.length,
      duplicates: duplicates.length > 0 ? duplicates : undefined
    });
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
    const updatedEntry = await EntryReportModel.findOneAndUpdate(
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



//-----------------------------------------------------
// Monthly Report 

const monthlyReport = async (req, res) => {
  try {
    const {month} = req.query; // Expecting month like "jan-25"

    // Fetch entry reports for the month
    const entryReports = await EntryReportModel.find({month});

    // Fetch active customers
    const activeCustomers = await CustomerModel.find({status: 'Active'});

    // Map customers with their payment info
    const reportData = activeCustomers.map(customer => {
      // Find matching entry report by boxNumber and cardNumber
      const report = entryReports.find(er => er.boxNumber === customer.boxNumber && er.cardNumber === customer.cardNumber);

      return {
        cardNumber: customer.cardNumber,
        boxNumber: customer.boxNumber,
        customerName: customer.customerName,
        phoneNumber: customer.phoneNumber || '',
        street: customer.street || '',
        company: customer.company,
        paymentStatus: report ? (report.paid === 'paid' ? 'Paid' : 'Unpaid') : 'Unpaid',
        amount: report ? report.amount : '-'
      };
    });

    // Create worksheet from JSON
    const worksheet = XLSX.utils.json_to_sheet(reportData);

    // Create workbook and append worksheet
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Monthly Report');

    // Write workbook to buffer
    const buffer = XLSX.write(workbook, {type: 'buffer', bookType: 'xlsx'});

    // Set HTTP headers for file download
    res.setHeader('Content-Disposition', `attachment; filename=Monthly_Report_${month}.xlsx`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

    // Send the Excel buffer as response
    res.send(buffer);

  } catch (error) {
    res.status(500).json({message: 'Error generating monthly report', error: error.message});
  }
};



// ----------------------------------------------------------

// Delete data for month

const deleteData = async (req, res) => {
  const {selectedMonth} = req.body
  // console.log(req)
  try {
    const delResponse = await EntryReportModel.deleteMany({month: selectedMonth})
    console.log(delResponse)
    res.status(200).json({message: "Data deleted successfully"})
  }
  catch (er) {
    res.status(500).json({message: "Server error in Delete Data"})
  }
}



// -------------------------------------------------------------------------
/// day wise Report 


// Controller for /api/report/day-excel
const downloadDayReportExcel = async (req, res) => {
  try {
    const selectedDate = req.query.date;
    console.log(selectedDate)

    // Get all entry reports matching day
    const entryReports = await EntryReportModel.find({day: selectedDate});

    // Get unique boxNumbers from entryReports
    const boxNumbers = entryReports.map(er => er.boxNumber);

    // Get customer data for these boxNumbers
    const customers = await CustomerModel.find({
      boxNumber: {$in: boxNumbers}
    });

    // Helper: create lookup for customer by boxNumber
    const customerLookup = {};
    customers.forEach(cust => {
      customerLookup[cust.boxNumber] = cust;
    });

    // Create Excel workbook and worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Day Report');

    // Define headers
    worksheet.columns = [
      {header: "Customer Name", key: "customerName", width: 25},
      {header: "Box Number", key: "boxNumber", width: 15},
      {header: "Card Number", key: "cardNumber", width: 20},
      {header: "Street", key: "street", width: 30},
      {header: "Company", key: "company", width: 20},
      {header: "Phone Number", key: "phoneNumber", width: 15},
      {header: "Amount", key: "amount", width: 15}
    ];

    // Fill rows from entry reports using customer info
    entryReports.forEach(report => {
      const cust = customerLookup[report.boxNumber];
      if (cust) {
        worksheet.addRow({
          customerName: cust.customerName,
          boxNumber: cust.boxNumber,
          cardNumber: cust.cardNumber,
          street: cust.street || "",
          company: cust.company,
          phoneNumber: cust.phoneNumber || "",
          amount: report.amount
        });
      }
    });

    // Send workbook as Excel file
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=DayReport-${selectedDate}.xlsx`
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    res.status(500).json({error: err.message});
  }
};

// module.exports = {downloadDayReportExcel};


// -------------------------------------------------------------------------
// Dashboard Data

const dashboardData = async (req, res) => {
  try {
    // Step 1: Get the active month
    const activeMonth = await YearMonthModel.findOne({active: 1});
    if (!activeMonth) {
      return res.status(404).json({message: "No active month found"});
    }

    // Step 2: Get all customers (active and inactive)
    const allCustomers = await CustomerModel.find({});
    const activeCustomers = allCustomers.filter(c => c.status === 'Active');
    const inactiveCustomers = allCustomers.filter(c => c.status !== 'Active');

    // Step 3: Get entry reports for the active month
    const monthEntries = await EntryReportModel.find({month: activeMonth.month});

    // Step 4: Count paid for the active month
    const paidCount = monthEntries.filter(entry => entry.paid === 'paid').length;

    // Step 5: Calculate unpaid as total customers - paid count
    const unpaidCount = allCustomers.length - paidCount;

    // Step 6: Calculate total amounts
    const totalPaidAmount = monthEntries
      .filter(entry => entry.paid === 'paid')
      .reduce((sum, entry) => sum + (entry.amount || 0), 0);

    const totalUnpaidAmount = monthEntries
      .filter(entry => entry.paid !== 'paid')
      .reduce((sum, entry) => sum + (entry.amount || 0), 0);

    // Step 7: Prepare dashboard response
    const dashboardResponse = {
      activeMonth: activeMonth.month,
      totalCustomers: allCustomers.length,
      activeCustomersCount: activeCustomers.length,
      inactiveCustomersCount: inactiveCustomers.length,
      paidCount: paidCount,
      unpaidCount: unpaidCount,
      totalPaidAmount: totalPaidAmount,
      totalUnpaidAmount: totalUnpaidAmount,
      pendingPayments: unpaidCount, // For visualization
      completedPayments: paidCount, // For visualization
      paymentPercentage: allCustomers.length > 0 ? ((paidCount / allCustomers.length) * 100).toFixed(2) : 0
    };

    res.status(200).json(dashboardResponse);
  } catch (error) {
    console.error("Error in dashboardData:", error);
    res.status(500).json({message: 'Server Error', error: error.message});
  }
};


module.exports = {
  login,
  fetchCustomers, fetchMonths,
  changeMonth, saveCustomerPayment,
  uploadCustomers, addCustomer,
  searchCustomer, editCustomerBox,
  editCustomerDetails,
  monthlyReport, downloadDayReportExcel,
  deleteData, dashboardData
};
