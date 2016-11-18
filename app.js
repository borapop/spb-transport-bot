var TelegramBot = require('node-telegram-bot-api');
var bot = new TelegramBot(process.env.TELEGRAM_OGRP_BOT_TOKEN, {polling: true});
var Ogrp = require('ogrp');
var ogrp = new Ogrp('./gtfs/', () => {
  console.log('GTFS data loaded');
});

function prepareForecastMessage(forecast) {
  var message = '';
  for (let i = 0; i < forecast.length; i++) {
    var route = ogrp.getRouteById(forecast[i].routeId);
    if (!route) continue;
    var type;
    if (route.transport_type == 'bus') type = '&#128652;';
    else if (route.transport_type == 'trolley') type = '&#128654;';
    else if (route.transport_type == 'tram') type = '&#128651;';
    var timeLeft = new Date(Date.parse(forecast[i].arrivingTime) - Date.now() + (new Date()).getTimezoneOffset() * 60 * 1000);
    if (!timeLeft) continue;
    var timeLeftString = '';
    if (timeLeft.getHours() > 0) {
      timeLeftString += timeLeft.getHours() + ' ч '
    }
    if (timeLeft.getMinutes() > 0) {
      timeLeftString += timeLeft.getMinutes() + ' мин';
      message += type + ' <b>' + route.route_short_name  + '</b> через ' + timeLeftString + '\n';
    } else {
      message += type + ' <b>' + route.route_short_name  + '</b> сейчас ' + '\n';
    }
  }
  return message;
}

bot.on('message', function(msg, match) {
  if (isNaN(msg.text)) {

  } else {
    ogrp.getForecastByStop(msg.text, (err, forecast) => {
      console.log(forecast);
      var message = prepareForecastMessage(forecast.result);
      if (message) {
        bot.sendMessage(msg.from.id, message, {
          parse_mode: 'html'
        });
      }
    });
  }
});

bot.on('location', function(msg, match){
  console.log(msg);
  var stop = ogrp.getStopByLocation(msg.location.latitude, msg.location.longitude);
  if (stop) {
    ogrp.getForecastByStop(stop.stop_id, (err, forecast) => {
      console.log(err);
      if (err) return;
      console.log(forecast);
    });
  } else {
    console.log('NOSTOP');
  }

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
    var stops = ogrp.getNearestStops(msg.location.latitudeTELEGRAM_OGRP_BOT_TOKEN, msg.location.longitude);
    if (stops) {
      if (stops.length > 50) {
        stops = stops.slice(-50);
      }
      var answerInlineQuery = function(inlineArray) {
        bot.answerInlineQuery(msg.id, inlineArray);
      }
      var collection = new CollectArrayAsync(stops.length, answerInlineQuery);
      for (let i = 0; (i < stops.length); i++) {
        ogrp.getForecastByStop(stops[i].stop_id, (err, forecast) => {
          if (err) return;
          var message = prepareForecastMessage(forecast.result);
          if (message) {
            collection.push({
              id: stops[i].stop_id.toString(),
              type: 'article',
              title: stops[i].stop_name.toString() + ' ' + stops[i].transport_type,
              input_message_content:  {
                message_text: message,
                parse_mode: 'html'
              }
            });
          } else {
            collection.push({
              id: stops[i].stop_id.toString(),
              type: 'article',
              title: stops[i].stop_name.toString(),
              input_message_content:  {
                message_text: 'Прогноз недоступен',
                parse_mode: 'html'
              }
            });
          }
        });
      }
    }
  }/*
  if (msg.query.length) {
    var routes = ogrp.getRoutesByQuery(msg.query);
    if (routes.length) {
      var inlineResultArray = [];
      for (let i = 0; (i < routes.length) && (i < 50); i++) {
        ogrp.getForecastByStop(msg.text, (err, forecast) => {
          if (err) return;
          console.log(forecast);
          var message = prepareForecastMessage(forecast.result);
          if (message) {
            inlineResultArray.push({
              id: routes[i].route_id.toString(),
              type: 'article',
              title: routes[i].route_short_name.toString(),
              input_message_content:  {
                message_text: message,
                parse_mode: 'html'
              }
            });
          }
        });

      }
      console.log(inlineResultArray);
      bot.answerInlineQuery(msg.id, inlineResultArray);
    }
  }*/
});
