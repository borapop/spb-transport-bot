const bot = require('../lib/bot');
const transport = require('../lib/transport');
const view = require('../view');

function CollectArrayAsync(arrayLength, cb) {
  let Array = [];
  let Cb = cb;
  this.push = function(elem) {
    Array.push(elem);
    if (Array.length == arrayLength) {
      Array.sort((a, b) => {
        if (a.distance > b.distance) return 1;
        if (!a.distance) return 1;
        if (a.distance < b.distance) return -1;
        if (a.distance == b.distance) return 0;
      });
      cb(Array);
    }
  };
}

module.exports = function(msg, match) {
  if (msg.location && !msg.query.length) {
    let stops = transport.getNearestStops(1000, msg.location.latitude, msg.location.longitude);
    if (stops) {
      if (stops.length > 40) {
        stops = stops.splice(-40);
      }
      let answerInlineQuery = function(inlineArray) {
        bot.answerInlineQuery(msg.id, inlineArray, {
          cache_time: 0
        }).catch(e => {
          console.dir(e);
        });
      };
      let collection = new CollectArrayAsync(stops.length, answerInlineQuery);
      for (let i = 0; (i < stops.length); i++) {
        transport.getForecastByStopId(stops[i].stop_id, (err, forecast) => {
          if (err || !forecast) return;
          let message = view.prepareForecastMessage(transport, stops[i], forecast.result);
          if (message) {
            collection.push({
              id: stops[i].stop_id.toString(),
              type: 'article',
              title: view.inlineStopTitle(stops[i].stop_name.toString(), stops[i].transport_type.toString()),
              input_message_content:  {
                message_text: message,
                parse_mode: 'html'
              },
              reply_markup: {
                inline_keyboard : [
                  [{
                    text: view.moreStops,
                    callback_data: JSON.stringify({
                      count: 0,
                      lat: msg.location.latitude,
                      lon: msg.location.longitude
                    })
                  }]
                ]
              },
              thumb_url: view.getMapThumbnailUrl(stops[i].stop_lat, stops[i].stop_lon, 18, 150, 150)
            });
          } else {
            collection.push({
              id: stops[i].stop_id.toString(),
              type: 'article',
              title: stops[i].stop_name.toString(),
              input_message_content:  {
                message_text: view.forecastIsUnavailible,
                parse_mode: 'html'
              }
            });
          }
        });
      }
    }
  }
};
