var express = require('express');
var app = express();
var http = require( "http" ).Server(app);

const multer = require('multer');


app.get( "/", function( req, res ){
	res.sendFile(__dirname + '/upload.html');
});

const path = require('path');

const upload = multer({
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
      cb(null, new Date().valueOf() + path.extname(file.originalname));
    }
  }),
});

app.post('/uploaded', upload.single('file'), (req, res) => {
	console.log( req.file );
  // res.json({
  //   title:'111'
  // });
  res.download('uploads/cat.jpg');
            
});

http.listen(8000, function () {
    console.log("Listening on *:8000");
});