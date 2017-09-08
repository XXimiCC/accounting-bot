const mongoose = require('mongoose');

const User = mongoose.Schema({
    _id: Number,
    firstName: String,
    lastName: String,
    username: String,
    lastMessageId: Number,
    balance: {
        type: Number,
        get: (balance) => balance / 100,
        set: (balance) => balance.toFixed(2) * 100
    }
});

const UserModel = mongoose.model('User', User);

module.exports = UserModel;