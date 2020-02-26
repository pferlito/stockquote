const express = require('express');
const app = express();
const open = require('open');
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const d3_rnd = require('d3-random');

let stocks = [{
  symbol: 'CSCO',
  open: 50,
  current: 50
}];
const sigma = 0.25; // standard deviation
// Brownian motion formula
const rnFn = d3_rnd.randomNormal(0, Math.pow(sigma, 2));

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
    stock.current = updatePrice(stock.current);
  });
}

io.on('connection', function (socket) {
  setInterval(() => {
    updatePrices(stocks);
    const json = JSON.stringify(stocks);
    io.emit('message', [new Date(), json]);
    console.log([new Date(), json]);
  }, 1000)
});

http.listen(3000, async function () {
  await open('http://localhost:3000');
  console.log('listening on *:3000');
});
