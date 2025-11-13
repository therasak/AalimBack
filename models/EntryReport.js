const mongoose = require('mongoose')

const customerSchema = new mongoose.Schema({
    boxNumber: {
        type: String,
        required: true,
    },
    cardNumber: {
        type: String,
        required: true,
    },
    month: {
        type: String,
        required: true,
    },
    day: {
        type: String,
        required: true,
    },
    amount: {
        type: Number,
        required: true,
    },
    paid: {
        type: String,
        enum: ["paid", "unpaid"],
        required: true,
    },
});
module.exports = mongoose.model('EntryReport', customerSchema)