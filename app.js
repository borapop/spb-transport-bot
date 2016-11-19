var TelegramBot = require('node-telegram-bot-api');
var bot = new TelegramBot(process.env.TELEGRAM_OGRP_BOT_TOKEN, {polling: true});

var view = require('./view');
var Ogrp = require('ogrp');
var ogrp = new Ogrp('./gtfs/', () => {
  console.log('GTFS data loaded');
});

bot.on('message', function(msg, match) {
  if (isNaN(msg.text)) {

  } else {
    ogrp.getForecastByStop(msg.text, (err, forecast) => {

      var message = view.prepareForecastMessage(forecast.result);
      if (message) {
        bot.sendMessage(msg.from.id, message, {
          parse_mode: 'html'
        });
      }
    });
  }
});

bot.on('location', function(msg){
  var lat = msg.location.latitude;
  var lon = msg.location.longitude;
  var stops = ogrp.getNearestStops(lat, lon);
  if (stops) {
    var sendMessage = function(message) {
      bot.sendMessage(msg.from.id, message, {
        parse_mode: 'html',
        reply_markup: {
          inline_keyboard : [
            [{
              text: view.nextStopButton,
              callback_data: JSON.stringify({
                count: 0,
                lat: lat,
                lon: lon
              })
            }]
          ]
        }
      });
    }
    ogrp.getForecastByStop(stops[0].stop_id, (err, forecast) => {
      if (err) return;
      var message = view.prepareForecastMessage(ogrp, stops[0], forecast.result);
      sendMessage(message);
    });
  }
});

bot.on('callback_query', function(msg) {
  var data = JSON.parse(msg.data);
  if (data.count < 0) return;
  var stops = ogrp.getNearestStops(data.lat, data.lon);
  if (!stops[data.count]) return;
  if ( (data.count > 0) && (data.count < stops.length - 1) ) {
    var inline_keyboard = [[{
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
    var inline_keyboard = [[{
        text: view.previosStopButton,
        callback_data: JSON.stringify({
          count: data.count - 1,
          lat: data.lat,
          lon: data.lon
        })
      }]]
  }
  if (data.count == 0) {
    var inline_keyboard = [[{
        text: view.nextStopButton,
        callback_data: JSON.stringify({
          count: data.count + 1,
          lat: data.lat,
          lon: data.lon
        })
      }]];
  }
  if (inline_keyboard == undefined) return;
  ogrp.getForecastByStop(stops[data.count].stop_id, (err, forecast) => {
    if (err) return;
    var message = view.prepareForecastMessage(ogrp, stops[data.count], forecast.result);
    if (msg.message) {
      bot.editMessageText(message ,{
        chat_id: msg.from.id,
        message_id: msg.message.message_id,
        parse_mode: 'html',
        reply_markup: {
          inline_keyboard : inline_keyboard
        }
      }).then(
        result => {
          console.log(reslut);
        },
        error => {
          console.log(error);
        }
      ).catch(error => {
        console.log(error);
      });
    } else {
      try {
        bot.editMessageText(message ,{
          inline_message_id: msg.inline_message_id,
          parse_mode: 'html',
          reply_markup: {
            inline_keyboard : inline_keyboard
          }
        });
      } catch(e) {
        console.log(e);
      }
    }
  });
});

function CollectArrayAsync(arrayLength, cb) {
  var Array = [];
  var Cb = cb;
  this.push = function(elem) {
    Array.push(elem);
    if (Array.length == arrayLength) cb(Array);
  };
}

bot.on('inline_query', function(msg, match) {
  if (msg.location && !msg.query.length) {
    var stops = ogrp.getNearestStops(msg.location.latitude, msg.location.longitude);
    if (stops) {
      if (stops.length > 50) {
        stops = stops.slice(-50);
      }
      var answerInlineQuery = function(inlineArray) {
        bot.answerInlineQuery(msg.id, inlineArray, {
          cache_time: 0
        });
      };
      var collection = new CollectArrayAsync(stops.length, answerInlineQuery);
      for (let i = 0; (i < stops.length); i++) {
        ogrp.getForecastByStop(stops[i].stop_id, (err, forecast) => {
          if (err) return;
          var message = view.prepareForecastMessage(ogrp, stops[i], forecast.result);
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
  } else if (msg.query.length) {

  }
});
