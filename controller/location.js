const bot = require('../lib/bot');
const transport = require('../lib/transport');
const view = require('../view');

module.exports = function(msg){
  let lat = msg.location.latitude;
  let lon = msg.location.longitude;
  let stops = transport.getNearestStops(1000, lat, lon);
  if (stops[0]) {
    let sendMessage = function(message) {
      bot.sendMessage(msg.from.id, message, {
        parse_mode: 'html',
        reply_markup: {
          inline_keyboard : [
            [{
              text: view.nextStopButton,
              callback_data: JSON.stringify({
                count: 1,
                lat: lat,
                lon: lon
              })
            }]
          ]
        }
      });
    }
    transport.getForecastByStopId(stops[0].stop_id, (err, forecast) => {
      if (err) return;
      let message = view.prepareForecastMessage(transport, stops[0], forecast.result);
      sendMessage(message);
    });
  } else {
    bot.sendMessage(msg.from.id, view.noNearestStops);
  }
};
