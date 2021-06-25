//웹 서버를 만들어주는 패키지
var express = require('express');
var app = express();
var http = require("http").Server(app);
var io = require('socket.io')(http);

var seq = 0;
var userList = [];

app.get("/", function (req, res) {
  res.sendFile(__dirname + "/index.html");
});

io.on('connection', function (socket) {
  seq = seq + 1;
  userId = 'user_' + seq
  userList.concat(userId)
  socket.on('new', function (data) {
    
    socket.emit('new', '{"userId":' + userId + '}');
  });

});

http.listen(8000, function () {
  console.log("Listening on *:8000");
});
