import React, { Component } from "react";
import socketIOClient from "socket.io-client";
// import { getUuidByString } from 'uuid-by-string';

class App extends Component {

    constructor() {
        super();
        this.state = {
            response: false,
            endpoint: "http://127.0.0.1:4001",
        };
    }

    // componentDidMount() {
    //     const { endpoint } = this.state;
    //     const socket = socketIOClient(endpoint);
    //     // socket.on('connect', function () {
    //     //     socket.emit('join', getUuidByString(data.email));
    //     // });
    //     socket.on("fromBackend", data => {
    //         console.log(JSON.stringify(data, null, 2));
    //         this.setState({
    //             response: data,
    //             // endpoint: `http://127.0.0.1:4001/${data.id}`
    //         });

    //         // if (data.id) {
    //         //     console.log('here');
    //         //     const endpoint = `http://127.0.0.1:4001/${data.id}`;
    //         //     socketIOClient(endpoint);
    //         //     // window.location = endpoint;
    //         // }
    //         socket.emit('join', data.id);

    //         socket.on('message', function (msg) {
    //             console.log('msg' + msg);
    //             this.setState({ response: msg });
    //         });
    //     });


    //     // setTimeout(() => {  // Not the best place to put this
    //     //     console.log('contacting backend...');
    //     //     socket.emit('clientConnected', this.state.response);
    //     //     // socket.emit('clientConnected', { email: this.state.response });
    //     // }, 5 * 1000);
    // }

    componentDidMount() {
        const { endpoint } = this.state;
        const socket = socketIOClient(endpoint);

        socket.on("fromBackend", data => {
            console.log(JSON.stringify(data, null, 2));
            this.setState({ response: data });
            socket.emit('join', data.id);
        });

        // socket.on('connect', () => {
        //     socket.emit('join', 'ad285d92-065b-3efb-b32f-3ebe5e83d527');
        // });

        socket.on('message', (msg) => {
            console.log(msg);
            this.setState({ response: msg });
        });
    }

    render() {
        const { response } = this.state;
        return (
            <div style={{ textAlign: "center" }}>
                {response && response.email ? <p>{response.email}</p> : (response && response.message) ? response.message : <p>Loading...</p>}
            </div>
        );
    }
}

export default App;