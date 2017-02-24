var express = require('express')
var ApiV1 = require("./src/http/apiv1")
var Socket = require("./src/http/socket")
var ParseApacheLog = require("./src/parseApacheLog")
var app = express();
var parseApacheLog = new ParseApacheLog();
var apiv1 = new ApiV1(parseApacheLog)

var server = app.listen(3001, function () {
  console.log('listening on port 3001!')
})

// Socket.io
new Socket(server, parseApacheLog);

// Api version 1
app.use('/api/v1/', apiv1.getRouter());

// Sever static files
app.use(express.static('public'));
app.get('/', function(req,res) {
  res.sendfile('public/index.html');
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.send({
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.send({
    message: err.message,
    error: {}
  });
});
