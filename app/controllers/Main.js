const Telegram = require('telegram-node-bot');
const TelegramBaseController = Telegram.TelegramBaseController;
const validator = require('validator');
const UserModel = require('../models/User');
const CategoryModel = require('../models/Category');
const TransactionModel = require('../models/Transaction');
const {TYPE_INCOME, TYPE_EXPENSE} = require('../const');
const _ = require('lodash');
const moment = require('moment');
const {monthNames} = require('../helpers');
const AccountingBot = require('../Bot');

class MainController extends TelegramBaseController {
    constructor(tg) {
        super();

        this.tg = tg;
    }

    get routes() {
        return {
            'start': 'startHandler',
            'balance': 'showBalanceHandler',
            'income': 'incomeHandler',
            'expense': 'expenseHandler',
            'history': 'transactionHistoryHandler',
            'analytics': 'analyticsHandler',
            'inline': 'inlineHandler'
        }
    }

    startHandler ($) {
        UserModel.findById($.userId).then((user) => {
            if (user) {
                this._mainMenu($);
            } else {
                this._requestStartBalance($);
            }
        });
    }

    showBalanceHandler ($) {
        UserModel.findById($.userId).then((user) => {
            $.sendMessage(`Ваш баланс: ${user.balance.toFixed(2)}`);
        });
    }

    incomeHandler ($) {
        this._transactionHandler($, TYPE_INCOME);
    }

    expenseHandler ($) {
        this._transactionHandler($, TYPE_EXPENSE);
    }

    _transactionHandler ($, transactionType) {
        let question = (transactionType === TYPE_INCOME)
                        ? 'Какую сумму Вы заработали?'
                        : 'Какую сумму Вы потратили?',
            categoryQuestion = (transactionType === TYPE_INCOME)
                                ? 'Как вы их получили?'
                                : 'На что Вы их потратили?';

        $.runForm({
            amount: {
                q: question,
                error: 'Укажите число, например 2500.50',
                validator: (message, callback) => {
                    if(validator.isDecimal(message.text)) {
                        callback(true, parseFloat(message.text));
                        return
                    }

                    callback(false)
                }
            }
        }, ({amount}) => {
            CategoryModel.find({type: transactionType}, (err, categories) => {
                $.runInlineMenu({
                    method: 'sendMessage',
                    params: [categoryQuestion],
                    menu: categories.map((category) => {
                        return {
                            text: category.title,
                            callback: this._categoryCallbackGenerator($, transactionType, amount, category._id)
                        }
                    })
                });
            });
        });
    }

    transactionHistoryHandler ($) {
        let date = new Date(), y = date.getFullYear(), m = date.getMonth();
        let firstDay = new Date(y, m, 1);
        let lastDay = new Date(y, m + 1, 1);

        const bot = new AccountingBot(this.tg);

        bot.getTransactionHistoryMessage($.userId, m, y).then((message) => {
            $.sendMessage(message, {
                parse_mode:'Markdown',
                reply_markup: JSON.stringify({
                    inline_keyboard: [
                        [
                            {
                                text: '<<',
                                callback_data: 'history_' + (m-1) + '_' + y
                            },
                            {
                                text: '>>',
                                callback_data: 'history_' + (m+1) + '_' + y
                            }
                        ]
                    ]
                })
            });
        });

        // TransactionModel.find({'user': $.userId, 'date': {
        //     '$gte': firstDay,
        //     '$lte': lastDay,
        // }}, (err, transactions) => {
        //     CategoryModel.find((err, categories) => {
        //         let messageHeader, message = '';
        //         let incomeSum = 0;
        //         let expenseSum = 0;
        //
        //         transactions.forEach((transaction) => {
        //             let operator = (transaction.type === TYPE_EXPENSE) ? '-' : '+',
        //                 categoryName = _.find(categories, {_id: transaction.category}).title,
        //                 date = moment(transaction.date).format('DD/MM/YYYY');
        //
        //             if (transaction.type === TYPE_EXPENSE) {
        //                 expenseSum+= transaction.amount;
        //             } else {
        //                 incomeSum+= transaction.amount;
        //             }
        //
        //
        //             message+= '*' + date + '*\n';
        //             message+= categoryName + '\n';
        //             message+= '*' + operator + transaction.amount + '*\n';
        //             // message+= '*' + operator + transaction.amount + '*  ' + categoryName + ' ' + date + '\n';
        //             message+= '----------------------------------------------------------\n';
        //         });
        //
        //         messageHeader = '*' + monthNames[m] + ' ' + y + '*\n';
        //         messageHeader+= 'Всего заработано: *' + incomeSum.toFixed(2) + '*\n';
        //         messageHeader+= 'Всего потрачено: *' + expenseSum.toFixed(2) + '*\n';
        //         messageHeader+= '---------------------------------------------------------\n';
        //
        //         message = messageHeader + message;
        //
        //
        //     });
        // });
    }

    inlineHandler ($) {
        let options = {
            reply_markup: JSON.stringify({
                inline_keyboard: [
                    [
                        {
                            text: '<',
                            callback_data: 'prev'
                        },
                        {
                            text: '>',
                            callback_data: 'next'
                        }
                    ],
                    [
                        {
                            text: 'back',
                            callback_data: 'back'
                        }
                    ]
                ]
            })
        };


        $.sendMessage('TEST 123', options).then(function () {
            console.log(arguments);
        });
    }

    _requestStartBalance($) {
        $.sendMessage('Для начала работы боту необходимо знать ваше текущее финансовое состояние.');
        $.runForm({
            balance: {
                q: 'Какая сумма у вас сейчас на руках?',
                error: 'Укажите число, например 2500.50',
                validator: (message, callback) => {
                    if(validator.isDecimal(message.text)) {
                        callback(true, parseFloat(message.text));
                        return
                    }

                    callback(false)
                }
            }
        }, ({balance}) => {
            let {firstName, lastName, username} = $.message.from;

            let userModel = new UserModel({
                _id: $.userId,
                lastMessageId: $.message.messageId,
                balance,
                firstName,
                lastName,
                username,
            });

            userModel.save((err) => {
                $.sendMessage('Отлично, теперь вы можете пользоваться всеми функциями бота.');
                this._mainMenu($);
            })
        });
    }

    _mainMenu($) {
        $.runMenu({
            message: 'Что будем делать?',
            layout: 2,
            resizeKeyboard: true,
            'Записать доход': ($) => {
                this.incomeHandler($);
            },
            'Записать расход': ($) => {
                this.expenseHandler($);
            },
            'Аналитика': ($) => {},
            'Баланс': ($) => {
                this.showBalanceHandler($);
            },
            'История': ($) => {
                this.transactionHistoryHandler($);
            },
        });
    }

    _categoryCallbackGenerator ($, transactionType, amount, categoryId) {
        return () => {
            let transaction = new TransactionModel({
                user: $.userId,
                type: transactionType,
                category: categoryId,
                amount: amount
            });

            transaction.save((err) => {
                if (err) {
                    console.error('Transaction failed', err)
                } else {
                    console.log('Transaction success');
                }
            });

            this._changeBalance($, transaction);
        }
    }

    _changeBalance ($, transaction) {
        UserModel.findById($.userId).then((user) => {
            let newBalance = (transaction.type === TYPE_INCOME)
                ? user.balance + transaction.amount
                : user.balance - transaction.amount;

            user.balance = newBalance;

            user.save((err) => {
                $.sendMessage(`Ваш текущий баланс: ${newBalance.toFixed(2)}`);
            });
        });
    }
}

module.exports = MainController;