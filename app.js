var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

const fs = require('fs');
const speech = require('@google-cloud/speech');

const client = new speech.SpeechClient();

var socket_io = require('socket.io');

var app = express();

var io = socket_io();
app.io = io;

var indexRouter = require('./routes/index')(io);
var usersRouter = require('./routes/users')(io);

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

const languageCode = 'en-US'; //en-US get from socket ->

const request = {
    config: {
        encoding: 'LINEAR16',
        sampleRateHertz: 16000,
        languageCode: languageCode,
    },
    interimResults: true
};

const STREAMING_LIMIT = 55000;

io.on( "connection", function( socket )
{
    console.log( "A user connected" );

    let recognizeStream = null;

    socket.on('startStream', function (data) {
        startStream(this, data);
    });

    socket.on('stopStream', function (data) {
        stopStream();
    });

    function startStream(socket, data) {
      recognizeStream = client
        .streamingRecognize(request)
        .on('error', console.error)
        .on('data', (data) => {
          if (data.results[0] && data.results[0].alternatives[0]){
            process.stdout.clearLine();
            process.stdout.cursorTo(0);
            process.stdout.write(data.results[0].alternatives[0].transcript);
            if (data.results[0].isFinal) process.stdout.write('\n');
            socket.emit('transcription', data.results[0].alternatives[0].transcript);
          }
        });
        socket.on('binaryStream', function(data) {
          recognizeStream.write(data);
        });
    }
    function stopStream() {
      recognizeStream = null;
    }
    setTimeout(function() {
      stopStream();
      startStream(socket);
    }, STREAMING_LIMIT);

});

module.exports = app;
