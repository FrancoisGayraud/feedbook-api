const router = require('express').Router();
const models = require('../models');
const config = require('../bin/config');
const tools = require('./tools');
const jwtDecode = require('jwt-decode');


// TODO FAIRE UN ENDPOINT POUR RECUP LES USER POUR AVOIR LES ID

router.post('/', tools.verifyToken, (req, res, next) => {
  let receiverId;
  let decoded = jwtDecode(token);
  if (!decoded)
    return res.status(403).json({status: 403, success: false, msg: "Token is invalid"});
  if (!req.body.content) {
    return res.status(422).json({status: 422, success: false, msg: 'Missing parameter content.'});
  }
  if (!req.body.receiver_id && !req.body.username && !req.body.email) {
    return res.status(422).json({status: 422, success: false, msg: 'Missing parameter receiver_id or username or email.'});
  }
  if (req.body.username) {
    return models.Users.findOne({where: {username: req.body.username}}).then((usr) => {
      receiverId = usr.id;
      return models.Users.findOne({where: {email: decoded.email}}).then((usr) => {
        return models.Messages.create({
          receiver_id: receiverId,
          content: req.body.content,
          sender_id: usr.id,
          sent_at: new Date()
        }).then((msg) => {
          return res.status(200).json({status: 200, message: msg, msg: "Messages successfully sent.", success: true});
        })
      })
    }).catch((err) => next(err));
  }
  else if (req.body.receiver_id) {
    return models.Users.findOne({where: {email: decoded.email}}).then((usr) => {
      return models.Messages.create({
        receiver_id: req.body.receiver_id,
        content: req.body.content,
        sender_id: usr.id,
        sent_at: new Date()
      }).then((msg) => {
        return res.status(200).json({status: 200, message: msg, msg: "Messages successfully sent.", success: true});
      })
    }).catch((err) => next(err));
  }
  else if (req.body.email) {
    return models.Users.findOne({where: {email: req.body.email}}).then((usr) => {
      receiverId = usr.id;
      return models.Users.findOne({where: {email: decoded.email}}).then((usr) => {
        return models.Messages.create({
          receiver_id: receiverId,
          content: req.body.content,
          sender_id: usr.id,
          sent_at: new Date()
        }).then((msg) => {
          return res.status(200).json({status: 200, message: msg, msg: "Messages successfully sent.", success: true});
        })
      })
    }).catch((err) => next(err));
  }
});

router.get('/', tools.verifyToken, (req, res, next) => {
  let decoded = jwtDecode(token);
  if (!decoded)
    return res.status(403).json({status: 403, success: false, msg: "Token is invalid"});
  return models.Users.findOne({where: {email: decoded.email}}).then((usr) => {
    models.Messages.findAll({where: {receiver_id: usr.id}}).then((msgs) => {
      return res.status(200).json({
        status: 200,
        messages: msgs,
        msg: "Messages successfully retrieved.",
        success: true
      });
    })
  }).catch((err) => next(err));
});

module.exports = router;