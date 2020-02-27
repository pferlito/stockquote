import React, {useEffect, useState} from 'react';
import socketIOClient from 'socket.io-client';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official'


const http_port = 5000;

function App() {
  const [config, setConfig] = useState({
    response: false
  });
  const options = {
    title: {
      text: 'My chart'
    },
    series: [{
      data: [1, 2, 3]
    }]
  }
  useEffect(() => {

    const socket = socketIOClient(`http://localhost:${http_port}`);
    socket.on('connect', () => {
      setConfig((config) => { return {...config, response: true}});
    });
    socket.on('message', function(msg){
      console.log(msg);
    });
    socket.on('connect_error', (error) => {
      console.log('connection error: ', error);
      // stop polling on error
      socket.close();
    });
  },[]);

  return (
    <div style={{ textAlign: "center" }}>
      {config.response ? <p /> : <p>Loading</p>}
      <HighchartsReact
        highcharts={Highcharts}
        options={options}
      />
    </div>
  );
}

export default App;