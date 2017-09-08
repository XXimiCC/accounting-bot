const config = require('./config');
const UserModel = require('./models/User');
const CategoryModel = require('./models/Category');
const TransactionModel = require('./models/Transaction');
const {TYPE_INCOME, TYPE_EXPENSE} = require('./const');
const _ = require('lodash');
const moment = require('moment');
const {monthNames} = require('./helpers');

class AccountingBot {
    constructor(tg) {
        this.tg = tg;
    }

    getTransactionHistoryMessage(userId, month, year) {
        return new Promise((resolve, reject) => {
            let firstDay = new Date(year, month, 1);
            let lastDay = new Date(year, month + 1, 1);

            TransactionModel.find({
                'user': userId, 'date': {
                    '$gte': firstDay,
                    '$lte': lastDay,
                }
            }, (err, transactions) => {
                CategoryModel.find((err, categories) => {
                    let messageHeader, message = '';
                    let incomeSum = 0;
                    let expenseSum = 0;

                    transactions.forEach((transaction) => {
                        let operator = (transaction.type === TYPE_EXPENSE) ? '-' : '+',
                            categoryName = _.find(categories, {_id: transaction.category}).title,
                            date = moment(transaction.date).format('DD/MM/YYYY');

                        if (transaction.type === TYPE_EXPENSE) {
                            expenseSum += transaction.amount;
                        } else {
                            incomeSum += transaction.amount;
                        }


                        message += '*' + date + '*\n';
                        message += categoryName + '\n';
                        message += '*' + operator + transaction.amount + '*\n';
                        // message+= '*' + operator + transaction.amount + '*  ' + categoryName + ' ' + date + '\n';
                        message += '----------------------------------------------------------\n';
                    });

                    messageHeader = '*' + monthNames[month] + ' ' + year + '*\n';
                    messageHeader += 'Всего заработано: *' + incomeSum.toFixed(2) + '*\n';
                    messageHeader += 'Всего потрачено: *' + expenseSum.toFixed(2) + '*\n';
                    messageHeader += '---------------------------------------------------------\n';

                    message = messageHeader + message;

                    resolve(message);
                });
            });
        });
    }
}

module.exports = AccountingBot;