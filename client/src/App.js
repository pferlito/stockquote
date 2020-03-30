import React, {useEffect, useState, useRef, useCallback} from 'react';
import io from 'socket.io-client';
import './App.css';
import {Chart} from './Chart'

const http_port = 5000;

const getEmptyQuote = (symbol) => {
  return {
    symbol,
    quotes: []
  }
}

/**
 * Round timestamp down to the minute.
 * @param {string} timestamp
 * @returns {string}
 */
const getMinutes = (timestamp) => {
  return Math.floor(timestamp / 60000) * 60000;
}

/**
 * Get nested property.
 * @param {array} p Path to property
 * @param {object} o Object to inspect
 * @returns {*}
 */
const get = (p, o) =>
  p.reduce((obj, prop) =>
    (obj && obj[prop]) ? obj[prop] : null, o);

/**
 * Get Price quotes for a symbol.
 * @param {string} symbol
 * @param {Map} data
 * @returns {array}
 */
const getQuotes = (symbol, data) => {
  let quotes = [];
  if (data.size) {
    quotes = data.get(symbol).quotes;
  }
  return quotes;
}

/**
 * Get latest price quote for a symbol.
 * @param {symbol} symbol
 * @param {Map} data
 * @returns {array}
 */
const getLastQuote = (symbol, data) => {
  let quotes = getQuotes(symbol, data);
  return quotes.length ? quotes[quotes.length - 1] : [];
}

function Table({quote}) {
  let previousQuote = useRef([]);

  let [time, open, high, low, lastPrice] = quote;
  let previousPrice = get(['4'], previousQuote.current);
  let deltaDir = 'unch';
  let delta = 0;

  if (lastPrice && previousPrice) {
    delta = Math.round((lastPrice - previousPrice) * 100) / 100;
    if (delta > 0) {
      deltaDir = "up";
    } else if (delta < 0) {
      deltaDir = "down";
    }
  }

  // save quote for comparison with the next one
  useEffect(() => {
    previousQuote.current = quote;
  }, [quote])

  return (
    <tr>
      <td>CSCO</td>
      <td className={`delta-${deltaDir} last`}>{lastPrice}</td>
      <td>{delta}</td>
      <td>{open}</td>
      <td>{high}</td>
      <td>{low}</td>
    </tr>
  );
}

/**
 * data = {
 * 'CSCO': {
 *  symbol: 'CSCO',
 *  quotes: [
 *    [123456,49.97,49.98,49.55,49.97],
 *    [123456,49.97,49.98,49.55,49.97]
 *  ]
 * },
 * 'AAPL': {
 *  symbol: 'AAPL',
 *  quotes: [
 *    [123456,49.97,49.98,49.55,49.97],
 *    [123456,49.97,49.98,49.55,49.97]
 *  ]
 * }
 * }
 */
function App() {
  const [config, setConfig] = useState({
    response: false
  });
  const [data, setData] = useState(new Map());
  const minutes = useRef(0);
  let currentSymbol = 'CSCO';



  // Add new quote to price history
  const addQuote = useCallback((quote) => {
    if (quote.hasOwnProperty('ohlc')) {
      const quoteTime = quote.time;
      const quoteMinutes = new Date(quoteTime).getMinutes();
      const {symbol, open, high, low, last} = quote.ohlc;
      setData((data) => {
        let clonedData = new Map(data);
        if (!clonedData.has(currentSymbol)) {
          clonedData.set(currentSymbol, getEmptyQuote(currentSymbol));
        }
        let quotes = clonedData.get(currentSymbol).quotes;
        if (minutes.current === quoteMinutes) {
          // update last candlestick
          quotes.splice(quotes.length - 1, 1,
            [getMinutes(quoteTime), open, high, low, last]);
        } else {
          // create new candlestick
          minutes.current = quoteMinutes;
          quotes.push([getMinutes(quoteTime), open, high, low, last]);
        }
        return clonedData;
      });
    }
  }, []);

  useEffect(() => {
    const socket = io(`http://localhost:${http_port}`);

    socket.on('connect', () => {
      setConfig((config) => {
        return {...config, response: true}
      });
      setConfig((config) => {
        return {...config, response: true}
      });
    });

    socket.on('message', function (quote) {
      addQuote(quote);
    });

    socket.on('connect_error', (error) => {
      console.log('connection error: ', error);
      // stop polling on error
      socket.close();
    });
  }, [addQuote]);

  let lastQuote = getLastQuote(currentSymbol, data);
  let chartData = getQuotes(currentSymbol, data);

  return (
    <div>
      {config.response ? <p/> : <p>Loading</p>}
      <Chart symbol={currentSymbol} data={chartData}/>
      <table className="holdings">
        <thead>
        <tr>
          <td>Symbol</td>
          <td>Last</td>
          <td>Change</td>
          <td>Open</td>
          <td>High</td>
          <td>Low</td>
        </tr>
        </thead>
        <tbody>
        {lastQuote.length >= 1 && <Table quote={lastQuote}/>}
        </tbody>
      </table>
    </div>
  )
}

export default App;