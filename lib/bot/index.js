const TelegramBot = require('node-telegram-bot-api');
const bot = new TelegramBot(process.env.TELEGRAM_OGRP_BOT_TOKEN, {polling: true});

module.exports = bot;
