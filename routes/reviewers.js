const router = require('express').Router();
const models = require('../models');
const config = require('../bin/config');
const tools = require('./tools');
const jwtDecode = require('jwt-decode');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

router.post('/', tools.verifyToken, (req, res, next) => {
  let reviewerId;
  let decoded = jwtDecode(token);
  if (!decoded)
    return res.status(403).json({status: 403, success: false, msg: "Token is invalid"});
  if (!req.body.reviewer_id && !req.body.username && !req.body.email) {
    return res.status(422).json({status: 422, success: false, msg: 'Missing parameter reviewer_id or username or email.'});
  }
  if (req.body.username) {
    return models.Users.findOne({where: {username: req.body.username}}).then((reviewerUsr) => {
      if (!reviewerUsr)
        return res.status(404).json({success: false, msg: 'This user doesn\'t exist', status: 404});
      reviewerId = reviewerUsr.id;
      return models.Users.findOne({where: {email: decoded.email}}).then((usr) => {
        return models.Reviewers.findOne({where: {reviewer_id: reviewerId, author_id: usr.id}}).then((reviewer) => {
          if (reviewer)
            return res.status(409).json({status: 409, success: false, msg: 'This account is already a reviewer.'});
          else
            return models.Reviewers.create({
              reviewer_id: reviewerId,
              author_id: usr.id,
              created_at: new Date()
            }).then((reviewer) => {
              tools.sendMail(reviewerUsr.email, "Vous avez été ajouté à la liste de reviewer de " + usr.username, "Vous êtes devenu un reviewer Feedbook!");
              return res.status(200).json({
                status: 200,
                reviewer: reviewer,
                msg: "Reviewer successfully add.",
                success: true
              });
            });
          });
      });
    }).catch((err) => next(err));
  }
  else if (req.body.reviewer_id) {
    return models.Users.findById(req.body.reviewer_id).then((reviewerUsr) => {
      if (!reviewerUsr)
        return res.status(404).json({success: false, msg: 'This user doesn\'t exist', status: 404});
      return models.Users.findOne({where: {email: decoded.email}}).then((usr) => {
        return models.Reviewers.findOne({
          where: {
            reviewer_id: req.body.reviewer_id,
            author_id: usr.id
          }
        }).then((reviewer) => {
          if (reviewer)
            return res.status(409).json({status: 409, success: false, msg: 'This account is already a reviewer.'});
          else
            return models.Reviewers.create({
              reviewer_id: req.body.reviewer_id,
              author_id: usr.id,
              created_at: new Date()
            }).then((msg) => {
              tools.sendMail(reviewerUsr.email, "Vous avez été ajouté à la liste de reviewer de " + usr.username, "Vous êtes devenu un reviewer Feedbook!");
              return res.status(200).json({
                status: 200,
                message: msg,
                msg: "Reviewer successfully add.",
                success: true
              });
            })
      })
    })
    }).catch((err) => next(err));
  }
  else if (req.body.email) {
    return models.Users.findOne({where: {email: req.body.email}}).then((usr) => {
      if (!usr)
        return res.status(404).json({success: false, msg: 'This user doesn\'t exist', status: 404});
      reviewerId = usr.id;
      return models.Users.findOne({where: {email: decoded.email}}).then((usr) => {
        return models.Reviewers.findOne({where: {reviewer_id: reviewerId, author_id: usr.id}}).then((reviewer) => {
          if (reviewer)
            return res.status(409).json({status: 409, success: false, msg: 'This account is already a reviewer.'});
          else
            return models.Reviewers.create({
              reviewer_id: reviewerId,
              author_id: usr.id,
              created_at: new Date()
            }).then((msg) => {
              tools.sendMail(req.body.email, "Vous avez été ajouté à la liste de reviewer de " + usr.username, "Vous êtes devenu un reviewer Feedbook!");
              return res.status(200).json({
                status: 200,
                message: msg,
                msg: "Reviewer successfully add.",
                success: true
              });
            })
        })
      })
    }).catch((err) => next(err));
  }
});

// retrieve all reviewer when I am an author
router.get('/author', tools.verifyToken, (req, res, next) => {
  let decoded = jwtDecode(token);
  if (!decoded)
    return res.status(403).json({status: 403, success: false, msg: "Token is invalid"});
  return models.Users.findOne({where: {email: decoded.email}}).then((usr) => {
    return models.Reviewers.findAll({
      where: {author_id: usr.id},
      include: [{model: models.Users, as: 'reviewer',
        attributes: ['username', 'email', 'last_login', 'date_joined', 'first_name', 'last_name', 'is_staff', 'is_active', 'is_superuser', 'id']}]
    }).then((reviewers) => {
      return res.status(200).json({
        status: 200,
        success: true,
        msg: "Reviewers successfully retrieved.",
        reviewers: reviewers
      });
    })
  }).catch((err) => next(err));
});

// retrieve all author that I can review
router.get('/reviewing', tools.verifyToken, (req, res, next) => {
  let decoded = jwtDecode(token);
  if (!decoded)
    return res.status(403).json({status: 403, success: false, msg: "Token is invalid"});
  return models.Users.findOne({where: {email: decoded.email}}).then((usr) => {
    return models.Reviewers.findAll({
      where: {reviewer_id: usr.id},
      include: [{model: models.Users, as: 'author',
        attributes: ['username', 'email', 'last_login', 'date_joined', 'first_name', 'last_name', 'is_staff', 'is_active', 'is_superuser', 'id']}]
    }).then((reviewers) => {
      return res.status(200).json({
        status: 200,
        success: true,
        msg: "Author that you are reviewing successfully retrieved.",
        reviewers: reviewers
      });
    })
  }).catch((err) => next(err));
});


// TODO AJOUTER ENVOIE MAIL
router.delete('/:id', tools.verifyToken, (req, res, next) => {
  let decoded = jwtDecode(token);
  if (!decoded)
    return res.status(403).json({status: 403, success: false, msg: "Token is invalid"});
  return models.Reviewers.findById(req.params.id).then((reviewer) => {
    if (reviewer)
      return models.Reviewers.destroy({where: {id: req.params.id}}).then(() => {
        return res.status(200).json({status: 200, msg: "Reviewer successfully deleted.", success: true});
      });
    else
      return res.status(404).json({status: 404, msg: "Reviewer with this id not found", success: false});
  }).catch((err) => next(err));
});

module.exports = router;