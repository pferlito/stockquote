import React, {useEffect, useState, useRef} from 'react';
import socketIOClient from 'socket.io-client';
import Highcharts from 'highcharts/highstock';
import HighchartsReact from 'highcharts-react-official';

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
    </div>
  )
}

export default App;