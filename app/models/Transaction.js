const mongoose = require('mongoose');

const Transaction = mongoose.Schema({
    type: String,
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
    user: { type: Number, ref: 'User' },
    amount: Number,
    date: { type: Date, default: Date.now },
});

const TransactionModel = mongoose.model('Transaction', Transaction);

module.exports = TransactionModel;