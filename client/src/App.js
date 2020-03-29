import React, {useEffect, useState, useRef} from 'react';
import socketIOClient from 'socket.io-client';
import './App.css';
import {Chart} from './Chart'

const http_port = 5000;

/**
 * Get nested property.
 * @param {array} p Path to property
 * @param {object} o Object to inspect
 * @returns {*}
 */
const get = (p, o) =>
  p.reduce((obj, prop) =>
    (obj && obj[prop]) ? obj[prop] : null, o);

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
    } else if (delta < 0){
      deltaDir = "down";
    }
  }

  // save quote for comparison with the next one
  useEffect(() => {
    previousQuote.current = quote;
  },[quote])

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

function App() {
  const [config, setConfig] = useState({
    response: false
  });
  const [data, setData] = useState([]);
  const minutes = useRef(0);
  let currentSymbol = '';

  /**
   * Round timestamp down to the minute.
   * @param {string} timestamp
   * @returns {string}
   */
  const getMinutes = (timestamp) => {
    return Math.floor(timestamp / 60000) * 60000;
  }

  const addQuote = (quote) => {
    if (quote.hasOwnProperty('ohlc')) {
      const quoteTime = quote.time;
      const quoteMinutes = new Date(quoteTime).getMinutes();
      const {symbol, open, high, low, last} = quote.ohlc[0];
      currentSymbol = symbol;
      setData((data) => {
        let updatedData = [...data];
        if (minutes.current === quoteMinutes) {
          // update last candlestick
          updatedData.splice(updatedData.length - 1, 1,
            [getMinutes(quoteTime), open, high, low, last]);
        } else {
          // create new candlestick
          minutes.current = quoteMinutes;
          updatedData.push([getMinutes(quoteTime), open, high, low, last]);
        }
        return updatedData;
      });
    }
  }

  useEffect(() => {
    const socket = socketIOClient(`http://localhost:${http_port}`);
    socket.on('connect', () => {
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
  }, []);

  return (
    <div>
      {config.response ? <p/> : <p>Loading</p>}
      <Chart symbol={currentSymbol} data={data}/>
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
        {data.length >= 1 && <Table quote={data[data.length - 1]}/> }
          </tbody>
      </table>
    </div>
  )
}

export default App;