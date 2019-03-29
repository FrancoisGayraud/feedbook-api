var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var auth = require('./routes/auth');
var profile = require('./routes/profile');
var favorite = require('./routes/favorite');
var books = require('./routes/books');
var comments = require('./routes/comments');

var app = express();

var sequelize = require('./config/config');

require('./config/modelsRelations');

app.use(bodyParser.json({limit: '200mb', extended: true}));
app.use(bodyParser.urlencoded({ limit: '200mb', extended: true, parameterLimit: 1000000}));
app.use(cookieParser());

app.use('/api/v1', auth);
app.use('/api/v1/books', books);
app.use('/api/v1/profile', profile);
app.use('/api/v1/favorites', favorite);
app.use('/api/v1/comments', comments);


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  const err = new Error('Not Found');
  err.status = 404;
  next(err);
});

app.use(function(err, req, res, next) {
  res.status(err.status || 500).json({status: err.status || 500, msg: err.message, success: false});
});

sequelize
  .authenticate()
  .then(() => {
    console.log('Connection to database Feedbook has been established successfully.');
  })
  .catch(err => {
    console.error('Unable to connect to the database:', err);
  });

module.exports = app;


// user feedbook-api (feedbook)