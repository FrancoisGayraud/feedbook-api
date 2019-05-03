const jwtDecode = require('jwt-decode');
const router = require('express').Router();
const models = require('../models');
const bcrypt = require('bcrypt');
const config = require('../bin/config');
const tools = require('./tools');
let Sequelize = require("sequelize");
const Op = Sequelize.Op;

router.get('/authors', tools.verifyToken, (req, res, next) => {
  let decoded = jwtDecode(token);
  if (!decoded)
    return res.status(403).json({status: 403, success: false, msg: "Token is invalid"});
  else {
    let authorId = [];
    let count = 0;
    return models.Books.findAll().then((books) => {
      for (let i = 0; books[i]; i++) {
        if (!authorId.includes(books[i].dataValues.user_id)) {
          authorId[count] = books[i].dataValues.user_id;
          count++;
        }
      }
      return models.Users.findAll({
        where: {
          id: authorId
        },
        attributes: ['username', 'last_login', 'date_joined', 'id']
      }).then((authors) => {
        return res.status(200).json({
          status: 200,
          authors: authors,
          success: true,
          msg: "Authors retrieved successfully"
        });
      })
    }).catch((err) => next(err));
  }
});

router.get('/', tools.verifyToken, (req, res, next) => {
  let decoded = jwtDecode(token);
  if (!decoded)
    return res.status(403).json({
      status: 403,
      success: false,
      msg: "Token is invalid"
    });
  else {
    return models.Users.findAll({
      attributes: ['username', 'last_login', 'date_joined', 'id']
    }).then((users) => {
      return res.status(200).json({
        status: 200,
        users: users,
        success: true,
        msg: "Users retrieved successfully"
      });
    }).catch((err) => next(err));
  }
});

router.get('/search/:id', tools.verifyToken, (req, res, next) => {
  let decoded = jwtDecode(token);
  if (!decoded)
    return res.status(403).json({
      status: 403,
      success: false,
      msg: "Token is invalid"
    });
  else {
    return models.Users.findByPk(
      req.params.id, {
      attributes: ['username', 'last_login', 'date_joined', 'id']
    }).then((user) => {
      return res.status(200).json({
        status: 200,
        user: user,
        success: true,
        msg: "User retrieved successfully"
      });
    }).catch((err) => next(err));
  }
});

module.exports = router;