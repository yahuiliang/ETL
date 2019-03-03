import React from "react";
import ReactDOM from "react-dom";
import { createBrowserHistory } from "history";
import { Router } from "react-router-dom";

import "assets/scss/material-kit-react.scss?v=1.4.0";
import config from "./config";
import Amplify from "aws-amplify";

import App from './App';


const hist = createBrowserHistory();
Amplify.configure({
  Auth: {
    mandatorySignIn: true,
    region: config.cognito.REGION,
    userPoolId: config.cognito.USER_POOL_ID,
    identityPoolId: config.cognito.IDENTITY_POOL_ID,
    userPoolWebClientId: config.cognito.APP_CLIENT_ID
  },
  Storage: {
    region: config.s3.REGION,
    bucket: config.s3.BUCKET,
    identityPoolId: config.cognito.IDENTITY_POOL_ID
  },
  API: {
    endpoints: [
      {
        name: "ETL",
        endpoint: config.apiGateway.URL,
        region: config.apiGateway.REGION
      },
    ]
  }
});

ReactDOM.render(
  <Router history={hist}>
    <App />
  </Router>,
  document.getElementById("root")
);

// The code below is for initializing the chatting room
// var os = require('os');
// var nodeStatic = require('node-static');
// var http = require('http');
// var socketIO = require('socket.io');

// var io = socketIO.listen(app);
// io.sockets.on('connection', function(socket) {

//   // convenience function to log server messages on the client
//   function log() {
//     var array = ['Message from server:'];
//     array.push.apply(array, arguments);
//     socket.emit('log', array);
//   }

//   socket.on('message', function(message) {
//     log('Client said: ', message);
//     // for a real app, would be room-only (not broadcast)
//     socket.broadcast.emit('message', message);
//   });

//   socket.on('create or join', function(room) {
//     log('Received request to create or join room ' + room);

//     var clientsInRoom = io.sockets.adapter.rooms[room];
//     var numClients = clientsInRoom ? Object.keys(clientsInRoom.sockets).length : 0;
//     log('Room ' + room + ' now has ' + numClients + ' client(s)');

//     if (numClients === 0) {
//       socket.join(room);
//       log('Client ID ' + socket.id + ' created room ' + room);
//       socket.emit('created', room, socket.id);

//     } else if (numClients === 1) {
//       log('Client ID ' + socket.id + ' joined room ' + room);
//       io.sockets.in(room).emit('join', room);
//       socket.join(room);
//       socket.emit('joined', room, socket.id);
//       io.sockets.in(room).emit('ready');
//     } else { // max two clients
//       socket.emit('full', room);
//     }
//   });

//   socket.on('ipaddr', function() {
//     var ifaces = os.networkInterfaces();
//     for (var dev in ifaces) {
//       ifaces[dev].forEach(function(details) {
//         if (details.family === 'IPv4' && details.address !== '127.0.0.1') {
//           socket.emit('ipaddr', details.address);
//         }
//       });
//     }
//   });

//   socket.on('bye', function(){
//     console.log('received bye');
//   });

// });
