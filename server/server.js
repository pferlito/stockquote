const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const d3_rnd = require('d3-random');

const http_port = 5000;

let stocks = [{
  symbol: 'CSCO',
  open: 50,
  high: 50,
  low: 50,
  last: 50
}];
const sigma = 0.25; // standard deviation
// Brownian motion formula
const rnFn = d3_rnd.randomNormal(0, Math.pow(sigma, 2));

// serve build directory
app.use(express.static('public'));

/**
 * Update a single stock's price data.
 * @param {Object} stock
 * @param {Boolean} rollover
 * @returns {Object}
 */
function updateStock(stock, rollover) {
  const delta = rnFn();
  stock.last = stock.last + delta;
  // round to 2 decimal places
  stock.last = Math.round(stock.last * 100) / 100;

  if (rollover) {
    stock.open = stock.high = stock.low = stock.last;
  } else {
    stock.high = Math.max(stock.high, stock.last);
    stock.low = Math.min(stock.low, stock.last);
  }
  return stock;
}

/**
 * Update stocks price data.
 * @param {Array} stocks
 * @param {Boolean} rollover
 * @returns Array
 */
function updateStocks(stocks, rollover) {
  stocks = stocks.map((stock) => {
    stock = updateStock(stock, rollover);
    return stock;
  });
  return stocks;
}

let interval;
let currentMinutes = new Date().getMinutes();

io.on('connection', function (socket) {
  socket.join('CSCO');
  interval = setInterval(() => {
    const minutes = new Date().getMinutes();
    let rollover = false;
    if (minutes !== currentMinutes) {
      currentMinutes = minutes;
      rollover = true;
    }
    const priceData = updateStocks(stocks, rollover);
    io.to('CSCO').emit('message', {time: Date.now(), ohlc: priceData});
    console.log([Date.now(), priceData]);
  }, 3000)
});

http.listen(http_port, async function () {
  // await open(`http://localhost:${http_port}`);
  console.log(`listening on *:${http_port}`);
});
