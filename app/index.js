const mongoose = require('mongoose');
const config = require('./config');
const TelegramBot = require('telegram-node-bot');
const MainController = require('./controllers/Main');
const CallbackController = require('./controllers/Callback');
const CategoryModel = require('./models/Category');
const {TYPE_INCOME, TYPE_EXPENSE} = require('./const');

class App {
    constructor () {
        mongoose.connect(config.mongoUrl, {
            useMongoClient: true
        });

        this.tb = new TelegramBot.Telegram(config.telegramToken, {/*polling: true,*/ workers: 1});
    }

    run () {
        // this.upDB();
        this.tb.router
            .when(
                [
                    new TelegramBot.TextCommand('/start', 'start'),
                    new TelegramBot.TextCommand('Баланс', 'balance'),
                    new TelegramBot.TextCommand('Записать доход', 'income'),
                    new TelegramBot.TextCommand('Записать расход', 'expense'),
                    new TelegramBot.TextCommand('Аналитика', 'analytics'),
                    new TelegramBot.TextCommand('История', 'history'),
                    new TelegramBot.TextCommand('inline', 'inline')
                ],
                new MainController(this.tb)
            ).otherwise(
                new MainController(this.tb)
            ).callbackQuery(new CallbackController(this.tb))
    }


    upDB () {
        const expenseCategories = [
            'Продукты',
            'Транспорт',
            'Отдых',
            'Покупки',
            'Другое'
        ];

        const incomeCategories = [
            'Зарплата',
            'Подработка',
            'Другое'
        ];

        incomeCategories.forEach((category) => {
            new CategoryModel({
                title: category,
                type: TYPE_INCOME
            }).save((err) => {
                console.log(err);
            });
        });

        expenseCategories.forEach((category) => {
            new CategoryModel({
                title: category,
                type: TYPE_EXPENSE
            }).save();
        });
    }
}

module.exports = App;