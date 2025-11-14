const mongoose = require('mongoose')


const customerSchema = new mongoose.Schema({
    customerName: {
        type: String,
        required: true,
    },
    cardNumber: {
        type: String,
        required: true,
    },
    boxNumber: {
        type: String,
        required: true,
    },
    phoneNumber: {
        type: String,
        required: false,
    },
    street: {
        type: String,
        required: false,
    },
    company: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        enum: ["Active", "Inactive"],
        default: "Active",
    },
});

module.exports = mongoose.model('Customer', customerSchema)

