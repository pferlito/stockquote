import React, {useEffect, useState, useRef, useMemo} from 'react';
import socketIOClient from 'socket.io-client';
import Highcharts from 'highcharts/highstock';
import HighchartsReact from 'highcharts-react-official';

const http_port = 5000;

function App() {
  const [config, setConfig] = useState({
    response: false
  });
  const [quote, setQuote] = useState({});
  const minutes = useRef(0);

  const [options, setOptions] = useState({
    series: [{
      data: [],
      type: 'candlestick',
      name: 'CSCO Stock Price',
      id: 'csco'
    }],
    title: {
      text: 'CSCO Stock Price'
    },
    chart: {
      animation: false,
      events: {
        load: function () {
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
        }
      }
    },
    navigator: {
      enabled: false
    },
    time: {
      timezoneOffset: 7 * 60
    }
  });

  /**
   * Round timestamp down to the minute.
   * @param {string} timestamp
   * @returns {string}
   */
  const getMinutes = (timestamp) => {
    return Math.floor(timestamp / 60000) * 60000;
  }

  let currentData = useMemo(() => {
    const currentData = [...options.series[0].data];
    return currentData;
  },[options.series]);

  useEffect(() => {
    if (quote.hasOwnProperty('ohlc')) {
      const quoteTime = quote.time;
      const quoteMinutes = new Date(quoteTime).getMinutes();
      const {open, high, low, last} = quote.ohlc[0];
      //let currentData = getCurrentData();
      let lastElement = currentData.length - 1 ;
      if (minutes.current === quoteMinutes) {
        // update last candlestick
        currentData.splice(lastElement, 1,
          [getMinutes(quoteTime), open, high, low, last]);
      } else {
        // create new candlestick
        minutes.current = quoteMinutes;
        currentData.push([getMinutes(quoteTime), open, high, low, last]);
      }
      setOptions({
        series: [
          {data: currentData}
        ]
      })
    }
  }, [quote, currentData]);

  return (
    <div>
      {config.response ? <p/> : <p>Loading</p>}
      <HighchartsReact
        highcharts={Highcharts}
        constructorType={'stockChart'}
        options={options}
      />
    </div>
  )
}

export default App;