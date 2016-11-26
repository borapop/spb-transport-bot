const bot = require('../lib/bot');
const transport = require('../lib/transport');
const view = require('../view');

module.exports = function(msg) {
  let data = JSON.parse(msg.data);
  if (data.count < 0) return;
  let stops = transport.getNearestStops(1000, data.lat, data.lon);
  if (!stops[data.count]) return;
  let inline_keyboard;
  if ( (data.count > 0) && (data.count < stops.length - 1) ) {
    inline_keyboard = [[{
        text: view.previosStopButton,
        callback_data: JSON.stringify({
          count: data.count - 1,
          lat: data.lat,
          lon: data.lon
        })
      }, {
        text: view.nextStopButton,
        callback_data: JSON.stringify({
          count: data.count + 1,
          lat: data.lat,
          lon: data.lon
        })
      }]];
  }
  if (data.count == stops.length - 1) {
    inline_keyboard = [[{
        text: view.previosStopButton,
        callback_data: JSON.stringify({
          count: data.count - 1,
          lat: data.lat,
          lon: data.lon
        })
      }]]
  }
  if (data.count == 0) {
    inline_keyboard = [[{
        text: view.nextStopButton,
        callback_data: JSON.stringify({
          count: data.count + 1,
          lat: data.lat,
          lon: data.lon
        })
      }]];
  }
  if (inline_keyboard == undefined) return;
  transport.getForecastByStopId(stops[data.count].stop_id, (err, forecast) => {
    if (err) return;
    let message = view.prepareForecastMessage(transport, stops[data.count], forecast.result);
    if (msg.message) {
      bot.editMessageText(message ,{
        chat_id: msg.from.id,
        message_id: msg.message.message_id,
        parse_mode: 'html',
        reply_markup: {
          inline_keyboard
        }
      }).catch(error => {
        console.log(error);
      });
    } else {
      try {
        bot.editMessageText(message ,{
          inline_message_id: msg.inline_message_id,
          parse_mode: 'html',
          reply_markup: {
            inline_keyboard
          }
        });
      } catch(e) {
        console.log(e);
      }
    }
  });
};
