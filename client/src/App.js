import React, {useEffect, useState} from 'react';
import socketIOClient from 'socket.io-client';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';

const http_port = 5000;

function App() {
  const [options, setOptions] = useState({
    series: [
      {data: []}
    ],
  });
  const [config, setConfig] = useState({
    response: false
  });

  useEffect(() => {
    // TODO: look into using a ref to store the data

    const socket = socketIOClient(`http://localhost:${http_port}`);
    socket.on('connect', () => {
      setConfig((config) => {
        return {...config, response: true}
      });
    });
    socket.on('message', function (msg) {
      let data = JSON.parse(msg.price).shift();
      console.log(data.last);
      const newPrice = data.last;
      updateSeries(newPrice);
    });
    socket.on('connect_error', (error) => {
      console.log('connection error: ', error);
      // stop polling on error
      socket.close();
    });
  }, []);

  function updateSeries(newPrice) {
    const newOptions = {...options};
    const data = newOptions.series[0].data;
    if (data.length > 50) {
      data.shift();
    }
    data.push(newPrice);
    setOptions(newOptions);
  }

  return (
    <div>
      {config.response ? <p/> : <p>Loading</p>}
      <HighchartsReact
        highcharts={Highcharts}
        options={options}
      />
    </div>
  )
}

export default App;