

var view = {
  forecastIsUnavailible: 'Прогноз недоступен',
  noNearestStops: 'Остановок поблизости не найдено',
  previosStopButton: '< Туда',
  nextStopButton: 'Сюда >',
  moreStops: 'Другие остановки',
  getMapThumbnailUrl: function(lat, lon, zoom, sizeX, sizeY) {
    return 'https://static-maps.yandex.ru/1.x/?ll=' + lon + ',' + lat + '&z=' + zoom +
    '&size=' + sizeX + ',' + sizeY + '&l=map&pt=' + lon + ',' + lat + ',org';
  },
  getMapUrl: function(lat, lon, zoom) {

  },
  makeRouteMap: function(ogrp, res) {

  },
  inlineStopTitle: function(stopName, stopType) {
    if (stopType == 'bus') return stopName + ' (автобус)';
    if (stopType == 'tram') return stopName + ' (трамвай)';
    if (stopType == 'trolley') return stopName + ' (троллейбус)';
    return 'piece of shit';
  },
  prepareForecastMessage: function (ogrp, stop, forecast) {

    if (!forecast || !stop) return null;
    var href = view.getMapThumbnailUrl(stop.stop_lat, stop.stop_lon, 18, 450, 300);
    var link = '<a href="' + href + '">На карте</a>';
    var message = '<b>' + stop.stop_name + '</b>\n' + link + '\n';
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
};

module.exports = view;
