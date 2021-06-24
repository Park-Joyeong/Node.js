//웹 서버를 만들어주는 패키지
var express = require('express');
var app = express();
var http = require("http").Server(app);

//mysql 접속
var mysql = require('mysql')

var conn = mysql.createConnection({
  host: '',
  user: '',
  password: '',
  port: '',
  database: ''

});

app.get("/", function (req, res) {
  var sql = "SELECT * FROM USER";

  conn.query(sql, function (err, result) {
    if (err) {
      console.log(result)
      res.sendFile(__dirname + "/index.html");
    }
    else {
      console.log(result)
      res.sendFile(__dirname + "/index.html");
    }

  });
});



http.listen(8000, function () {
  console.log("Listening on *:8000");
});
