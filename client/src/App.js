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

/*
  tableData = [[
    'AAPL', {
      symbol: 'AAPL',
      quote: [12341251, 50.0, 49.8, 49.56, 50.01]
    }
  ],[
    'CSCO', {
      symbol: 'CSCO',
      quote: [12341251, 50.0, 49.8, 49.56, 50.01]
    }
  ]]

 */

function Table({tableData}) {
  let output = [];
  for (const [symbol, rowData] of tableData) {
    output.push (<TableRow key={symbol} rowData={rowData} />)
  }
  return output;
}

function TableRow({rowData}) {
  let symbol = rowData.symbol;
  let quote = rowData.quote;
  let [time, open, high, low, last, lastClose] = quote;
  let deltaDir = 'unch';
  let delta = last - lastClose;
  if (delta > 0) {
    deltaDir = 'up';
  } else if (delta < 0) {
    deltaDir = 'down'
  }

  return (
    <tr>
      <td>{symbol}</td>
      <td className={`delta-${deltaDir} last`}>{last.toFixed(2)}</td>
      <td>{delta.toFixed(2)}</td>
      <td>{open.toFixed(2)}</td>
      <td>{high.toFixed(2)}</td>
      <td>{low.toFixed(2)}</td>
      <td>{lastClose.toFixed(2)}</td>
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
      const {symbol, open, high, low, last, lastClose} = quote.ohlc;
      setData((data) => {
        let clonedData = new Map(data);
        if (!clonedData.has(symbol)) {
          clonedData.set(symbol, getEmptyQuote(symbol));
        }
        let quotes = clonedData.get(symbol).quotes;
        if (minutes.current === quoteMinutes) {
          // update last quote
          quotes.splice(quotes.length - 1, 1,
            [getMinutes(quoteTime), open, high, low, last, lastClose]);
        } else {
          // create new quote
          minutes.current = quoteMinutes;
          quotes.push([getMinutes(quoteTime), open, high, low, last, lastClose]);
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

  const getTableData = (data) => {
    const tableData = new Map();
    if (data.size) {
      for (let symbol of data.keys()) {
        let newObj = {symbol};
        newObj.quote = getLastQuote(symbol, data);
        tableData.set(symbol, newObj);
      }
    }
    return tableData;
  }

  let tableData = getTableData(data);
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
          <td>Previous Close</td>
        </tr>
        </thead>
        <tbody>
        <Table tableData={tableData} />
        </tbody>
      </table>
    </div>
  )
}

export default App;