'use strict';

var http = require('http');
var socketIO = require('socket.io');

var app = http.createServer().listen(8080);

var io = socketIO.listen(app);
io.sockets.on('connection', function (socket) {

  let _room = "";

  // convenience function to log server messages on the client
  function log() {
    var array = ['Message from server:'];
    array.push.apply(array, arguments);
    socket.emit('log', array);
  }

  socket.on('message', function (message) {
    log('Client said: ', message);
    // for a real app, would be room-only (not broadcast)
    socket.to(_room).emit('message', message);
  });

  socket.on('create or join', function (room) {
    log('Received request to create or join room ' + room);

    _room = room;

    var clientsInRoom = io.sockets.adapter.rooms[room];
    var numClients = clientsInRoom ? Object.keys(clientsInRoom.sockets).length : 0;
    log('Room ' + room + ' now has ' + numClients + ' client(s)');

    if (numClients === 0) {

      socket.join(room);

      console.log('Client ID ' + socket.id + ' created room ' + room);
      log('Client ID ' + socket.id + ' created room ' + room);

      socket.emit('created', room, socket.id);
    } else if (numClients === 1) {

      console.log('Client ID ' + socket.id + ' joined room ' + room);
      log('Client ID ' + socket.id + ' joined room ' + room);
      io.sockets.in(room).emit('join', room);

      socket.join(room);

      socket.emit('joined', room, socket.id);
      io.sockets.in(room).emit('ready');
    } else {
      // max two clients
      console.log('room ' + _room + ' is full');
      socket.emit('full', room);
    }
  });

  socket.on('hangup', () => {
    console.log('the peer send the hangup signal');
    socket.to(_room).emit('hangup');
  });

  socket.on('leave', function () {
    console.log('one client leave the room:' + _room);
    socket.leave(_room);
  });

});
