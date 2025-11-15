const {request} = require('express')
const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({

    userId: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    name: {
        type: String,
        request: true
    }
})

module.exports = mongoose.model('User', userSchema) 