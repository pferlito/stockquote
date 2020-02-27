import React, {useEffect, useState} from "react";
import socketIOClient from "socket.io-client";

/*
class App extends Component {
  constructor() {
    super();
    this.state = {
      response: false,
      endpoint: "http://localhost:5000"
    };
  }

  componentDidMount() {
    const { endpoint } = this.state;
    const socket = socketIOClient(endpoint);
    socket.on('message', function(msg){
      console.log(msg);
    });
  }

  render() {
    const { response } = this.state;
    return (
      <div style={{ textAlign: "center" }}>
        <p>Chart goes here</p>
      </div>
    );
  }
}
*/

function App() {
  const [config, setConfig] = useState({
    response: false
  });
  useEffect(() => {
    const socket = socketIOClient("http://localhost:5000");
    socket.on('connect', () => {
      setConfig((config) => { return {...config, response: true}});
    });
    socket.on('message', function(msg){
      console.log(msg);
    });
    socket.on('connect_error', (error) => {
      console.log('connection error: ', error);
      // don't keep polling
      socket.close();
    });
  },[]);

  return (
    <div style={{ textAlign: "center" }}>
      {config.response ? <p>Chart goes here</p> : <p>Loading</p>}
    </div>
  );
}

export default App;