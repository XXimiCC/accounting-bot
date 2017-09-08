const Telegram = require('telegram-node-bot');
const TelegramBaseCallbackQueryController = Telegram.TelegramBaseCallbackQueryController;

const config = require('../config');

class CallbackController extends TelegramBaseCallbackQueryController {
    constructor(tg) {
        super();

        this.tg = tg;
    }

    handle (query) {
        let dataParts = query.data.split('_'),
            method = dataParts[0],
            methodParams = [query, ...dataParts.slice(1)];

        this[method].apply(this, methodParams);


    }

    history (query, month, year) {
        console.log(month, year);
        //TODO Написать логику истории расходов и доходов
        this.tg.api.editMessageReplyMarkup({
            reply_markup: JSON.stringify({
                inline_keyboard: [
                    [
                        {
                            text: 'Предыдущий',
                            callback_data: 'prev'
                        },
                        {
                            text: 'Следующий',
                            callback_data: 'next'
                        }
                    ],
                    [
                        {
                            text: 'Выйти',
                            callback_data: 'back'
                        }
                    ]
                ]
            }),
            chat_id: query.message.chat.id,
            message_id: query.message.messageId
        });
    }
}

module.exports = CallbackController;