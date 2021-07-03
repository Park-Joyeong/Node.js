const express = require('express');
const app = express();
const http = require("http").Server(app);
const io = require('socket.io')(http);

app.use(express.static('static'));

const mysql = require('mysql')
require('dotenv').config();
const host = process.env.host;
const user = process.env.user;
const password = process.env.password;
const database = process.env.database;


const conn = mysql.createConnection({
  host: host,
  user: user,
  password: password,
  database: database
});

let seq = 0; // for naming username
const clients = {};



app.get("/", function (req, res) {
  res.sendFile(__dirname + "/index.html");
});

io.on('connection', function (socket) {

  let mySocketId = socket.id;
  let myUserName = 'User_' + ++seq;
  let myIpAddress = socket.request.connection.remoteAddress.substr(7);
  if (myIpAddress === '') myIpAddress = '127.0.0.1';
  let photoUri = 'profile_photo/basic.jpg';
  let sendObj = {};

  clients[mySocketId] = {
    socketId: mySocketId,
    userName: myUserName,
    photoUri: photoUri
  }

  let sql = "\
      INSERT INTO clients_info (\
      socket_id,\
      user_name,\
      ip_address,\
      photo_uri\
      )\
      VALUES ('" +
    mySocketId + "','" +
    myUserName + "','" +
    myIpAddress + "','" +
    photoUri + "'" +
    ")\
    ON DUPLICATE KEY UPDATE\
    user_name = '" + myUserName + "', \
    ip_address = '" + myIpAddress + "', \
    photo_uri = '" + photoUri + "';"

  conn.query(sql, function (err, result) {
    if (err) throw err;
  });


  sendObj = {};
  sendObj['mySocketId'] = mySocketId;
  sendObj['myUserName'] = myUserName;
  sendObj['clients'] = clients;
  socket.emit('forMe', sendObj);


  sendObj = {};
  sendObj['newSocketId'] = mySocketId;
  sendObj['newUserName'] = myUserName;
  sendObj['connectStatus'] = 'connected';
  socket.broadcast.emit('new', sendObj);




  socket.on("disconnect", (reason) => {
    delete clients[mySocketId];

    sendObj = {};
    sendObj['newSocketId'] = mySocketId;
    sendObj['newUserName'] = myUserName;
    sendObj['connectStatus'] = 'disconnected';
    io.emit('new', sendObj);
  });





  socket.on('sendMessage', function (param) {
    var senderSocketID = mySocketId;

    var targetSocketID = param.targetSocketID;

    var message = param.message;

    // var sql = "" +
    //   "INSERT INTO messages (" +
    //   "sender_ip," +
    //   "sender_socket_id," +
    //   "sender_user_id," +
    //   "target_socket_id," +
    //   "target_user_id," +
    //   "message" +
    //   ")" +
    //   "VALUES ('" +
    //   (senderIP == '' ? '127.0.0.1' : senderIP) + "','" +
    //   senderSocketID + "','" +
    //   senderUserID + "','" +
    //   (targetSocketID === '' ? 'For All' : targetSocketID) + "','" +
    //   targetUserID + "','" +
    //   message + "'" +
    //   ");";

    // conn.query(sql, function (err, result) {
    //   if (err) throw err;
    // });




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
