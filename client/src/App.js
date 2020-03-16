import React, {useEffect, useState, useRef} from 'react';
import socketIOClient from 'socket.io-client';
import Highcharts from 'highcharts/highstock';
import HighchartsReact from 'highcharts-react-official';

const http_port = 5000;

function App() {
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
      animation: false
    },
    navigator: {
      enabled: false
    },
    time: {
      timezoneOffset: 7 * 60
    }
  });
  const [config, setConfig] = useState({
    response: false
  });
  const [quote, setQuote] = useState({});
  const minutes = useRef(0);

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

    return socket.close;  // cleanup
  }, []);

  useEffect(() => {
    if (quote.hasOwnProperty('ohlc')) {
      const quoteTime = quote.time;
      const quoteMinutes = new Date(quoteTime).getMinutes();
      const {open, high, low, last} = quote.ohlc[0];
      let currentData = [...options.series[0].data];
      if (minutes.current === quoteMinutes) {
        currentData.splice(currentData.length - 1, 1,
          [quoteTime, open, high, low, last]);
      } else {
        minutes.current = quoteMinutes;
        currentData.push([quoteTime, open, high, low, last]);
      }
      setOptions({
        series: [
          {data: currentData}
        ]
      })
    }
  }, [quote]);

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