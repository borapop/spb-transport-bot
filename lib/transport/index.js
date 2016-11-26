const Orgp = require('orgp');
const orgp = new Orgp('./gtfs/', () => {
  console.log('GTFS data loaded');
});

module.exports = orgp;
