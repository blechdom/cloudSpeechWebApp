module.exports = function(io) {

  var express = require('express');
  var router = express.Router();

  router.get('/', function(req, res, next) {
    res.send('respond with a resource');
  });
  router.get('/cool', function(req, res, next) {
    res.send('you\'re so cool');
  });

  io.on('connection', function(socket) {
        console.log("connection inside of user.js");
    });

  return router;
}
