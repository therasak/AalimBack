const mongoose = require('mongoose')

const YearMonthSchema = new mongoose.Schema({
    month: {
        type: String,
        required: true,
    },
    active: {
        type: Number,
        required: true,
        default: 0
    }
});

module.exports = mongoose.model('YearMonth', YearMonthSchema)