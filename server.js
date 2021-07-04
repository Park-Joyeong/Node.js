const express = require('express');
const app = express();
const http = require("http").Server(app);
const io = require('socket.io')(http);
const multer = require('multer');
const path = require('path');
app.use(express.static('static'));

const upload = multer({
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'static/profile_photo');
    },
    filename: function (req, file, cb) {
      cb(null, new Date().valueOf() + path.extname(file.originalname));
    }
  }),
});


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

app.post('/editProfile', upload.single('profilePhotoFile'), (req, res) => {

  let sql = `
    UPDATE clients_info
    SET photo_uri = 'profile_photo/${req.file.filename}'
    WHERE socket_id = '${req.body.socketId}';
  `;

  conn.query(sql, function (err, result) {
    if (err) throw err;
  });
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ photo_uri: 'profile_photo/'+req.file.filename }));
});

io.on('connection', function (socket) {

  let mySocketId = socket.id;
  let myUserName = 'User_' + ++seq;
  let myIpAddress = socket.request.connection.remoteAddress.substr(7);
  if (myIpAddress === '') myIpAddress = '127.0.0.1';
  let myPhotoUri = 'profile_photo/basic.png';
  let sendObj = {};

  clients[mySocketId] = {
    socketId: mySocketId,
    userName: myUserName,
    photoUri: myPhotoUri
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
    myPhotoUri + "'" +
    ")\
    ON DUPLICATE KEY UPDATE\
    user_name = '" + myUserName + "', \
    ip_address = '" + myIpAddress + "', \
    photo_uri = '" + myPhotoUri + "';"

  conn.query(sql, function (err, result) {
    if (err) throw err;
  });


  sendObj = {};
  sendObj['mySocketId'] = mySocketId;
  sendObj['myUserName'] = myUserName;
  sendObj['myPhotoUri'] = myPhotoUri;
  sendObj['clients'] = clients;
  socket.emit('forMe', sendObj);


  sendObj = {};
  sendObj['newSocketId'] = mySocketId;
  sendObj['newUserName'] = myUserName;
  sendObj['newPhotoUri'] = myPhotoUri;
  sendObj['connectStatus'] = 'connected';
  socket.broadcast.emit('new', sendObj);




  socket.on("disconnect", (reason) => {
    delete clients[mySocketId];

    sendObj = {};
    sendObj['newSocketId'] = mySocketId;
    sendObj['newUserName'] = myUserName;
    sendObj['connectStatus'] = 'disconnected';
    socket.broadcast.emit('new', sendObj);
  });





  socket.on('sendMessage', function (param) {
    var senderSocketID = mySocketId;

    var targetSocketID = param.targetSocketID;

    var message = param.message;

    const sql = "" +
      "INSERT INTO messages (" +
      "sender_socket_id," +
      "target_socket_id," +
      "message" +
      ")" +
      "VALUES ('" +
      senderSocketID + "','" +
      (targetSocketID === '' ? 'For All' : targetSocketID) + "','" +
      message + "'" +
      ");";

    conn.query(sql, function (err, result) {
      if (err) throw err;
    });



    sendObj = {};
    sendObj['senderUserName'] = myUserName;
    sendObj['senderSocketId'] = mySocketId;
    sendObj['message'] = message;

    if (targetSocketID === '') { // To everyone
      sendObj['isDM'] = false;
      socket.broadcast.emit('receiveMessage', sendObj);
    } else { //Direct message
      sendObj['isDM'] = true;
      socket.broadcast.to(targetSocketID).emit('receiveMessage', sendObj);
    }

  });//sendMessage()

  socket.on("profileChange", (param) => {

    sendObj = {};
    sendObj['socketId'] = mySocketId;
    sendObj['photoUri'] = param.photoUri;
    socket.broadcast.emit('profileChange', sendObj);
  });
});



http.listen(8000, function () {
  console.log('running');
});
