const bot = require('../lib/bot');
const transport = require('../lib/transport');
const view = require('../view');

module.exports = function(msg, match) {
  if (isNaN(msg.text)) {

  } else {
    transport.getForecastByStopId(msg.text, (err, forecast) => {

      let message = view.prepareForecastMessage(forecast.result);
      if (message) {
        bot.sendMessage(msg.from.id, message, {
          parse_mode: 'html'
        });
      }
    });
  }
};
