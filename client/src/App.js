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
      const newOptions = {...options};
      const pdata = newOptions.series[0].data;
      if (pdata.length > 20) {
        pdata.shift();
      }
      pdata.push(newPrice);
      setOptions(newOptions);
    });

    socket.on('connect_error', (error) => {
      console.log('connection error: ', error);
      // stop polling on error
      socket.close();
    });
  },[]);

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