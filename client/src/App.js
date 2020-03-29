import React, {useEffect, useState, useRef} from 'react';
import socketIOClient from 'socket.io-client';
import Highcharts from 'highcharts/highstock';
import HighchartsReact from 'highcharts-react-official';
import './App.css';

const http_port = 5000;

function Chart({data}) {

  const options = {
    series: [{
      data: data,
      type: 'candlestick',
      name: `CSCO Stock Price`,
      id: 'csco'
    }],
    title: {
      text: `CSCO Stock Price`
    },
    rangeSelector: {
      buttons: [{
        type: 'hour',
        count: 1,
        text: '1 min',
        dataGrouping: {
          forced: true,
          units: [['minute', [1]]]
        }
      }, {
        type: 'hour',
        count: 2,
        text: '2 min',
        dataGrouping: {
          forced: true,
          units: [['minute', [2]]]
        }
      }, {
        type: 'hour',
        count: 2,
        text: '5 min',
        dataGrouping: {
          forced: true,
          units: [['minute', [5]]]
        }
      }, {
        type: 'all',
        text: 'All'
      }],
      buttonTheme: {
        width: 60
      },
      selected: 3,
      allButtonsEnabled: true,
      inputEnabled: false
    },
    navigator: {
      enabled: false
    },
    chart: {
      animation: false,
      events: {
        load: function () {
        }
      }
    },
    time: {
      timezoneOffset: 7 * 60
    }
  };

  return (
    <HighchartsReact
      highcharts={Highcharts}
      constructorType={'stockChart'}
      options={options}
    />
  )
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

function Table({quote}) {
  let [previousQuote, setPreviousQuote] = useState({time: 0});
  let delta = useRef("unch");
  let timesDiffer = false;

  if (previousQuote.time !== quote.time) {
    timesDiffer = true;
  }

  let ohlc = get(['ohlc','0'], quote) || [];
  let lastPrice = get(['ohlc','0','last'], quote);
  let previousPrice = get(['ohlc','0','last'], previousQuote);

  if (lastPrice && previousPrice && timesDiffer) {
    if (lastPrice > previousPrice) {
      delta.current = "up";
    } else if (lastPrice < previousPrice){
      delta.current = "down";
    } else {
      delta.current = "unch";
    }
  }

  // save quote for comparison with the next one
  useEffect(() => {
    setPreviousQuote(quote);
  },[quote])

  return (
    <tr>
      <td>CSCO</td>
      <td className={`delta-${delta.current} last`}>{ohlc.last}</td>
      <td>Change here</td>
      <td>{ohlc.open}</td>
      <td>{ohlc.high}</td>
      <td>{ohlc.low}</td>
    </tr>
  );
}

function App() {
  const [quote, setQuote] = useState({});
  const [config, setConfig] = useState({
    response: false
  });
  const [data, setData] = useState([]);
  const minutes = useRef(0);

  /**
   * Round timestamp down to the minute.
   * @param {string} timestamp
   * @returns {string}
   */
  const getMinutes = (timestamp) => {
    return Math.floor(timestamp / 60000) * 60000;
  }

  useEffect(() => {
    const socket = socketIOClient(`http://localhost:${http_port}`);
    socket.on('connect', () => {
      setConfig((config) => {
        return {...config, response: true}
      });
    });

    socket.on('message', function (msg) {
      setQuote(msg);
    });

    socket.on('connect_error', (error) => {
      console.log('connection error: ', error);
      // stop polling on error
      socket.close();
    });
  }, []);

  useEffect(() => {
    if (quote.hasOwnProperty('ohlc')) {
      const quoteTime = quote.time;
      const quoteMinutes = new Date(quoteTime).getMinutes();
      const {open, high, low, last} = quote.ohlc[0];
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
  }, [quote]);


  return (
    <div>
      {config.response ? <p/> : <p>Loading</p>}
      <Chart data={data}/>
      <table className="holdings">
        <thead>
        <tr>
          <td>Symbol</td>
          <td>Last</td>
          <td>Open</td>
          <td>High</td>
          <td>Low</td>
        </tr>
        </thead>
        <tbody>
            <Table quote={quote}/>
          </tbody>
      </table>
    </div>
  )
}

export default App;