const bot = require('./lib/bot');
const controller = require('./controller');

bot.on('message', controller.message);
bot.on('location', controller.location);
bot.on('inline_query', controller.inline_query);
bot.on('callback_query', controller.callback_query);
