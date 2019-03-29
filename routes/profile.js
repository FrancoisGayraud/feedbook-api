const router = require('express').Router();
const models = require('../models');
const config = require('../bin/config');
const tools = require('./tools');
const jwtDecode = require('jwt-decode');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

router.get('/me', tools.verifyToken, (req, res, next) => {
  let user;
  let decoded = jwtDecode(token);
  if (!decoded)
    return res.status(403).json({status: 403, success: false, msg: "Token is invalid."});
  return models.Users.findOne({ where: {email: decoded.email}}).then((usr) => {
    user = usr;
    return models.Profiles.findOne({where : {user_id: usr.dataValues.id}}).then((profile) => {
      return res.status(200).json({status: 200, user: user, profile: profile, msg: "User profile successfully retrieved.", success: true});
    })
  }).catch((err) => next(err));
});

router.get('/users', tools.verifyToken, (req, res, next) => {
  let user;
  let decoded = jwtDecode(token);
  if (!decoded)
    return res.status(403).json({status: 403, success: false, msg: "Token is invalid"});
  return models.Users.findOne({ where: {email: decoded.email}}).then((usr) => {
    user = usr;
    return models.Profiles.findOne({where : {user_id: usr.dataValues.id}}).then((profile) => {
      return res.status(200).json({status: 200, user: user, profile: profile, msg: "User profile successfully retrieved.", success: true});
    })
  }).catch((err) => next(err));
});

router.patch('/password', tools.verifyToken, (req, res, next) => {
  let infos = {};
  let decoded = jwtDecode(token);
  if (!req.body.old_password) {
    return res.status(409).json({status: 409, success: false, msg: "Missing old password."})
  }
  if (!decoded)
    return res.status(403).json({status: 403, success: false, msg: "Token is invalid."});
  if (req.body.password) {
    bcrypt.genSalt(10, function (err, salt) {
      if (err) {
        return next(err);
      }
      bcrypt.hash(req.body.password, salt, (err, hash) => {
        if (err) {
          return next(err);
        }
        infos.password = hash;
        return models.Users.findOne({where: {email: decoded.email}}).then((usr) => {
          bcrypt.compare(req.body.old_password, usr.password, (err, isMatch) => {
            if (isMatch) {
              return usr.update(infos).then((usr) => {
                return res.status(200).json({
                  status: 200,
                  user: usr,
                  msg: "Password successfully updated.",
                  success: true
                });
              })
            }
            else
              return res.status(409).json({status: 409, success: false, msg: "Old password doesn't match."})
          })
        }).catch((err) => next(err));
      })
    })
  } else {
    return res.status(422).json({status: 422, msg: "Missing parameter password.", success: false});
  }
});

router.patch('/staff', tools.verifyToken, (req, res, next) => {
  if (req.body.is_staff !== 0 && req.body.is_staff !== 1)
    return res.status(422).json({status: 422, msg: "Missing parameter is_staff (must be 1 or 0).", success: false});
  let decoded = jwtDecode(token);
  let infos = {};
  infos.is_staff = req.body.is_staff;
  if (!decoded)
    return res.status(403).json({status: 403, success: false, msg: "Token is invalid."});
  return models.Users.findOne({ where: {email: decoded.email}}).then((usr) => {
    return usr.update(infos).then((usr) => {
      return res.status(200).json({status: 200, msg: "Variable is_staff successfully updated.", user: usr});
    })
  }).catch((err) => next(err));
});

router.patch('/active', tools.verifyToken, (req, res, next) => {
  if (req.body.is_active !== 0 && req.body.is_active !== 1)
    return res.status(422).json({status: 422, msg: "Missing parameter is_active (must be 1 or 0).", success: false});
  let decoded = jwtDecode(token);
  let infos = {};
  infos.is_active = req.body.is_active;
  if (!decoded)
    return res.status(403).json({status: 403, success: false, msg: "Token is invalid."});
  return models.Users.findOne({ where: {email: decoded.email}}).then((usr) => {
    return usr.update(infos).then((usr) => {
      return res.status(200).json({status: 200, msg: "Variable is_active successfully updated.", user: usr});
    })
  }).catch((err) => next(err));
});

router.patch('/superuser', tools.verifyToken, (req, res, next) => {
  if (req.body.is_superuser !== 0 && req.body.is_superuser !== 1)
    return res.status(422).json({status: 422, msg: "Missing parameter is_superuser (must be 1 or 0).", success: false});
  let decoded = jwtDecode(token);
  let infos = {};
  infos.is_superuser = req.body.is_superuser;
  if (!decoded)
    return res.status(403).json({status: 403, success: false, msg: "Token is invalid."});
  return models.Users.findOne({ where: {email: decoded.email}}).then((usr) => {
    return usr.update(infos).then((usr) => {
      return res.status(200).json({status: 200, msg: "Variable is_superuser successfully updated.", user: usr});
    })
  }).catch((err) => next(err));
});

router.patch('/email', tools.verifyToken, (req, res, next) => {
  let decoded = jwtDecode(token);
  if (!req.body.email)
    return res.status(422).json({status: 422, msg: "Missing parameter email.", success: false});
  return models.Users.findOne({where : {token: req.headers.authorization}}).then((check) => {
    if (!check)
      return res.status(401).json({status: 401, msg: "Wrong token", success: false})
    else {
      return models.Users.findOne({where: {email: req.body.email}}).then((usr) => {
        if (!usr) {
          return models.Users.findOne({where: {email: decoded.email}}).then((user) => {
            user.update({email: req.body.email}).then((ret) => {
              jwt.sign({email: req.body.email}, config.secret, {expiresIn: '24h'}, (err, token) => {
                if (token) {
                  user.update({token: token}).then(() => {
                    return res.status(200).json({
                      status: 200,
                      success: true,
                      profile: ret,
                      msg: "Email successfully updated."
                    });
                  })
                }
              })
            })
          })
        } else if (decoded.email === req.body.email) {
          return res.status(200).json({status: 200, success: true, msg: 'Email successfully updated', user: usr});
        }
        else
          return res.status(409).json({status: 409, success: false, msg: "This email is already being used."})
      })
    }
  }).catch((err) => next(err));
});

router.patch('/me', tools.verifyToken, (req, res, next) => {
  let user;
  let infos = {};
  if (req.body.firstname)
    infos.first_name = req.body.firstname;
  if (req.body.lastname)
    infos.last_name = req.body.lastname;
  if (req.body.bio)
    infos.bio = req.body.bio;
  if (req.body.profile_picture)
    infos.profile_picture = req.body.profile_picture;
  if (req.body.username) {
    infos.username = req.body.username;
    infos.public_username = req.body.username;
  }
  if (req.body.gender)
    infos.gender = req.body.gender;
  let decoded = jwtDecode(token);
  if (!decoded)
    return res.status(403).json({status: 403, success: false, msg: "Token is invalid."});
  return models.Users.findOne({ where : {username: req.body.username}}).then((usr) => {
    if (!usr || usr.email === decoded.email) {
      return models.Users.findOne({where: {email: decoded.email}}).then((usr) => {
        return usr.update(infos).then((usr) => {
          user = usr;
          return models.Profiles.findOne({where: {user_id: usr.dataValues.id}}).then((profile) => {
            return profile.update(infos).then((profile) => {
              return res.status(200).json({
                status: 200,
                user: user,
                profile: profile,
                msg: "User successfully updated.",
                success: true
              });
            })
          });
        });
      }).catch((err) => next(err));
    }
    else
      return res.status(409).json({status: 409, success: false, msg: 'This username is already being used.'});
  });
});

module.exports = router;
