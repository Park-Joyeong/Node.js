//웹 서버를 만들어주는 패키지
var express = require('express');
var app = express();
var http = require("http").Server(app);
var io = require('socket.io')(http);

var seq = 0;
var clients = {};

app.get("/", function (req, res) {
  res.sendFile(__dirname + "/index.html");
});

io.on('connection', function (socket) {
  seq = seq + 1;
  userId = 'User_' + seq
  clients[socket.id] = userId;
  var sendObj = {}
  sendObj['userId'] = userId;
  sendObj['socketId'] = socket.id;
  sendObj['clients'] = clients;
  sendObj['connectStatus'] = 'connected';
  socket.emit('forMe', sendObj);
  io.emit('new', sendObj);

  socket.on('sendMessage', function (param) {

    var senderSocketID = socket.id;
    var targetSocketID = param.socketID;
    var message = param.message;

    sendObj = {};
    sendObj['senderSocketID'] = senderSocketID;
    sendObj['targetSocketID'] = targetSocketID;
    sendObj['message'] = message;

    if (targetSocketID === '') {
      console.log('For everyone');
      io.emit('receiveMessage', sendObj);
    } else {
      console.log('For one persons');
    }
    // console.log(targetSocketID);
    // console.log(message);

    //   sendObj['userId'] = userId;
    // sendObj['clients'] = clients;
    // socket.emit('forMe', sendObj);
    // io.emit('new', sendObj);

    //io.emit('receiveMessage', )
    // seq = seq + 1;
    // userId = 'User_' + seq
    // clients[socket.id] = userId;
    // var sendObj = {}
    // sendObj['userId'] = userId;
    // sendObj['clients'] = clients;
    // socket.emit('forMe', sendObj);
    // io.emit('new', sendObj);

  });//sendMessage()

  socket.on("disconnect", (reason) => {
    console.log('disconnect');
    console.log(reason);
    console.log(socket.id);
  });

});



http.listen(8000, function () {
  console.log("Listening on *:8000");
});
