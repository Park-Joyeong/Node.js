//웹 서버를 만들어주는 패키지
var express = require('express');
var app = express();
var http = require("http").Server(app);
var io = require('socket.io')(http);
var mysql = require('mysql')
require('dotenv').config();
let host = process.env.host;
let user = process.env.user;
let password = process.env.password;
let database = process.env.database;

var seq = 0;//for naming userid 
var clients = {};

var conn = mysql.createConnection({
  host: host,
  user: user,
  password: password,
  database: database
});


app.get("/", function (req, res) {
  res.sendFile(__dirname + "/index.html");
});

io.on('connection', function (socket) {

  seq = seq + 1;
  var userId = 'User_' + seq
  clients[socket.id] = userId;

  var sendObj = {}
  sendObj['userId'] = userId;
  sendObj['socketId'] = socket.id;
  sendObj['clients'] = clients;
  socket.emit('forMe', sendObj);


  sendObj['connectStatus'] = 'connected';
  io.emit('new', sendObj);


  socket.on("disconnect", (reason) => {
    delete clients[socket.id];
    sendObj = {};
    sendObj['socketId'] = socket.id;
    sendObj['connectStatus'] = 'disconnected';
    io.emit('new', sendObj);
  });





  socket.on('sendMessage', function (param) {
    var senderIP = socket.request.connection.remoteAddress.substr(7);//::ffff:124.46.41.154
    var senderSocketID = socket.id;
    var senderUserID = userId;

    var targetSocketID = param.socketID;
    var targetUserID = clients[targetSocketID] || "Everyone";

    var message = param.message;

    var sql = "" +
      "INSERT INTO messages (" +
      "sender_ip," +
      "sender_socket_id," +
      "sender_user_id," +
      "target_socket_id," +
      "target_user_id," +
      "message" +
      ")" +
      "VALUES ('" +
      (senderIP == '' ? '127.0.0.1' : senderIP) + "','" +
      senderSocketID + "','" +
      senderUserID + "','" +
      (targetSocketID === '' ? 'For All' : targetSocketID) + "','" +
      targetUserID + "','" +
      message + "'" +
      ");";

    conn.query(sql, function (err, result) {
      if (err) throw err;
    });




    sendObj = {};
    sendObj['senderSocketID'] = senderSocketID;
    sendObj['targetSocketID'] = targetSocketID;
    sendObj['message'] = message;

    if (targetSocketID === '') { // To everyone
      io.emit('receiveMessage', sendObj);
    } else { //Direct message
      socket.broadcast.to(targetSocketID).emit('receiveMessage', sendObj);
    }

  });//sendMessage()

});



http.listen(8000, function () {
  console.log('running');
});
