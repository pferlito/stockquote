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
      let price = JSON.parse(msg.price).shift();
      console.log(price.last);
      const newPrice = price.last;
      setOptions((myOpts) => {
        const newOpts = {...myOpts};
        const data = newOpts.series[0].data;
        data.push(newPrice);
        if (data.length > 20) {
          data.shift();
        }
        return newOpts;
      })
    });

    socket.on('connect_error', (error) => {
      console.log('connection error: ', error);
      // stop polling on error
      socket.close();
    });

    return socket.close;  // cleanup
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