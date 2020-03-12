const express = require('express');
const app = express();
const open = require('open');
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const d3_rnd = require('d3-random');

const http_port = 5000;

let stocks = [{
  symbol: 'CSCO',
  open: 50,
  last: 50
}];
const sigma = 0.25; // standard deviation
// Brownian motion formula
const rnFn = d3_rnd.randomNormal(0, Math.pow(sigma, 2));

// serve build directory
app.use(express.static('public'));

function updatePrice(price) {
  let delta = rnFn();
  price = price + delta;
  // round to 2 decimal places
  price = Math.round(price * 100) / 100;
  return price;
}

function updatePrices(stocks) {
  stocks = stocks.map((stock) => {
    stock.last = updatePrice(stock.last);
    return stock;
  });
  return stocks;
}

let interval;
io.on('connection', function (socket) {
  setInterval(() => {
    stocks = updatePrices(stocks);
    const json = JSON.stringify(stocks);
    io.emit('message', {time: new Date(), price: json});
    //console.log([new Date(), json]);
  }, 3000)
});

http.listen(http_port, async function () {
  // await open(`http://localhost:${http_port}`);
  console.log(`listening on *:${http_port}`);
});
