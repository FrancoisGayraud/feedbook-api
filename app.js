const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const auth = require('./routes/auth');
const profile = require('./routes/profile');
const favorite = require('./routes/favorite');
const books = require('./routes/books');
const comments = require('./routes/comments');
const messages = require('./routes/messages');
const reviewers = require('./routes/reviewers');
const reviews = require('./routes/reviews');
const users = require('./routes/users');

const app = express();

const sequelize = require('./config/config');

require('./config/modelsRelations');

app.use(bodyParser.json({limit: '200mb', extended: true}));
app.use(bodyParser.urlencoded({ limit: '200mb', extended: true, parameterLimit: 1000000}));
app.use(cookieParser());

app.use('/api/v1', auth);
app.use('/api/v1/books', books);
app.use('/api/v1/profile', profile);
app.use('/api/v1/favorites', favorite);
app.use('/api/v1/comments', comments);
app.use('/api/v1/messages', messages);
app.use('/api/v1/reviewers', reviewers);
app.use('/api/v1/reviews', reviews);
app.use('/api/v1/users', users);

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