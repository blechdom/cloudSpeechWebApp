module.exports = function(io) {

  var express = require('express');
  var router = express.Router();

  router.get('/', function(req, res, next) {
    res.render('index', { title: 'Cloud Speech API' });
  });

  io.on('connection', function(socket) {
        console.log("connection inside of index.js");
    });

  return router;
}


/*
var express = require('express');
var router = express.Router();


router.get('/', function(req, res, next) {
  res.render('index', { title: 'Cloud Speech API' });
});

module.exports = router;
*/
