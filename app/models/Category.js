const mongoose = require('mongoose');

const Category = mongoose.Schema({
    type: String,
    title: String
});

const CategoryModel = mongoose.model('Category', Category);

module.exports = CategoryModel;