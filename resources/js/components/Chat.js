import React, { Component } from "react";
import ReactDOM from 'react-dom';
import axios from "axios";

class Chat extends Component {

  render() {

    return (
        <div className="container">
        <div className="row justify-content-center">
            <div className="col-md-8">
                <div className="card card-default">
                    <div className="card-header">Messages</div>
                    <div className="card-body p-0">
                        <ul className="list-unstyled">
                            <li className="p-2">




                            </li>
                        </ul>
                    </div>
                </div>
                <input type="text"
                 onKeyPress={this.onKeyUp}
                name="message"

                placeholder="Enter your message..."
                className="form-control">
                </input>
<span className="text-muted">usuario esta escribiendo...</span>
            </div>
            <div className="col-md-4">
            <div className="card card-default">
                <div className="card-header">Active Users</div>
                <div className="card-body">
                    <ul>
                        <li>Horacio</li>
                    </ul>
                </div>
                </div>
            </div>
        </div>
    </div>
    );
  }
}

export default Chat;
if (document.getElementById('chat')) {
    ReactDOM.render(<Chat />, document.getElementById('chat'));
}
