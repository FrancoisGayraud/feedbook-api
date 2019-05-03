const jwt = require('jsonwebtoken');
const router = require('express').Router();
const models = require('../models');
const bcrypt = require('bcrypt');
const config = require('../bin/config');
const tools = require('./tools');
const randtoken = require('rand-token');

router.post('/login', (req, res, next) => {
  if (!req.body || !req.body.email || !req.body.password) {
    return res.status(422).json({
      status: 422,
      success: false,
      msg: 'Missing login information.'
    });
  }
  models.Users.findOne({where : {
    email: req.body.email
  }}).then((usr) => {
    if (!usr)
      return res.status(403).json({
        status: 403,
        success: false,
        msg: 'This mail doesn\'t exist.'
      });
    bcrypt.compare(req.body.password, usr.password, (err, isMatch) => {
      if (isMatch) {
        jwt.sign({
          email: usr.email},
          config.secret,
          {expiresIn: '24h'},
          (err, token) => {
            if (token) {
              usr.update({token: token, last_login: new Date()}).then(() => {
                return res.status(200).json({
                  status: 200,
                  success: true,
                  msg: 'User successfully login.',
                  token: token,
                  refresh_token: usr.refresh_token
                });
              })
            }
          });
      } else {
        return res.status(403).json({
          status: 403,
          success: false,
          msg: 'Wrong password.'
        });
      }
    });
  }).catch((err) => next(err));
});

router.patch('/password/reset/generate/code', (req, res, next) => {
  if (!req.body.email)
    return res.status(422).json({
      status: 422,
      success: false,
      msg: 'Missing email.'
    });
  let generated_reset_password_code = randtoken.generate(6);
  tools.sendMail(req.body.email, "Votre code de réinitialisation de vote mot de passe Feedbook : " + generated_reset_password_code, "Récupération de votre mot de passe Feedbook");
  return models.Users.findOne({
    where : {
      email: req.body.email
    }}).then((usr) => {
    if (usr)
      return usr.update({
        reset_password_code: generated_reset_password_code
      }).then(() => {
        return res.status(200).json({
          status: 200,
          success: true,
          msg : "Reset code successfully sent to email."
        })
      });
    else
      return res.status(403).json({
        status: 403,
        success: false,
        msg: "Email isn't associated with a Feedbook account."
      })
  }).catch((err) => next(err));
});

router.get('/password/reset/check/code/:code', (req, res, next) => {
  return models.Users.findOne({where: {reset_password_code: req.params.code}}).then((usr) => {
    if (!usr)
      return res.status(403).json({status: 403, success: false, msg: "This code is not valid."});
    else
      return res.status(200).json({status: 200, success: true, msg: "This code is valid."});
  }).catch((err) => next(err));
});

router.post('/password/reset/', (req, res, next) => {
  let infos = {};
  infos.reset_password_code = null;
  if (!req.body.code)
    return res.status(422).json({
      status: 422,
      success: false,
      msg: 'Missing code.'
    });
  if (!req.body.password)
    return res.status(422).json({
      status: 422,
      success: false,
      msg: 'Missing password.'
    });
  return models.Users.findOne({
    where: {
      reset_password_code: req.body.code
    }}).then((usr) => {
    if (!usr)
      return res.status(403).json({
        status: 403,
        success: false,
        msg: "This code is not valid."});
    else {
      bcrypt.genSalt(10, function (err, salt) {
        if (err) {
          return next(err);
        }
        bcrypt.hash(req.body.password, salt, (err, hash) => {
          if (err) {
            return next(err);
          }
          infos.password = hash;
          return usr.update(infos).then((usr) => {
            // TODO : get email of the user with the code sent, and send an email
            //tools.sendMail(req.body.email, "Votre mot de passe de votre compte Feedbook a été réinitialisé.", "Mot de passe Feedbook r&initialisé");
            return res.status(200).json({status: 200, sucecess: true, msg : "Password updated.", user: usr});
          })
        })
      })
    }
  }).catch((err) => next(err));
});

router.post('/token/refresh', (req, res, next) =>  {
  if (!req.body.refresh_token)
    return res.status(422).json({
      status: 422,
      success: false,
      msg: 'Missing refresh_token.'
    });
  else {
    models.Users.findOne({
      where : {
        refresh_token: req.body.refresh_token
      }}).then((usr) => {
      if (!usr)
        return res.status(403).json({
          status: 403,
          success: false,
          msg: 'Refresh token is invalid.'
        });
      jwt.sign({
        email: usr.email},
        config.secret,
        {expiresIn: '24h'},
        (err, token) => {
          if (token) {
            usr.update({
              token: token,
              last_login: new Date()
            }).then(() => {
              return res.status(200).json({
                status: 200,
                success: true,
                msg: 'Token successfully refresh.',
                token: token
              });
            })
          }
        })
    }).catch((err) => next(err));
  }
});

router.get('/token/verify', (req, res, next) => {
  jwt.verify(req.headers.authorization, config.secret, function(err, decoded) {
    if (decoded)
      return res.status(200).json({status: 200, success: true, msg: 'Token is valid.'});
    else
      return res.status(401). json({status: 401, success: false, msg: 'Token is expired or invalid.'});
  }).catch((err) => next(err));
});

router.post('/register', (req, res, next) => {
  let user;
  if (req.body === undefined || !req.body.email || !req.body.password || !req.body.username || !req.body.first_name || !req.body.last_name) {
    return res.status(422).json({
      status: 400,
      success: false,
      msg: 'Password, email, username, first_name and last_name are required.'
    });
  }
  bcrypt.genSalt(10, function (err, salt) {
    if (err) {
      return next(err);
    }
    bcrypt.hash(req.body.password, salt, (err, hash) => {
      if (err) {
        return next(err);
      }
      return models.Users.findOne({ where : {email: req.body.email}}).then((usr) => {
        if (usr) {
          return res.status(409).json({status: 409, success: false, msg: 'This mail is already being used.'});
        } else {
          return models.Users.findOne({ where : {username: req.body.username}}).then((usr) => {
            if (usr) {
              return res.status(409).json({status: 409, success: false, msg: 'This username is already being used.'});
            } else {
              return models.Users.create({
                email: req.body.email,
                password: hash,
                username: req.body.username,
                is_active: 1,
                is_staff: req.body.is_staff ? req.body.is_staff : 0,
                is_superuser: req.body.is_superuser ? req.body.is_superuser : 0,
                date_joined: new Date(),
                first_name: req.body.first_name,
                last_name: req.body.last_name,
                refresh_token: randtoken.generate(16)
              }).then((usr) => {
                user = usr;
                if (!usr) {
                  return res.status(500).json({status: 500, success: false, msg: 'Error in creating a new user.'});
                } else {
                  return models.Profiles.create({
                    public_username: req.body.username,
                    bio: req.body.bio ? req.body.bio : "L'utilisateur n'a pas rempli sa bio",
                    user_id: user.id,
                    gender: req.body.gender ? req.body.gender : "n"
                  }).then((profile) => {
                    tools.sendMail(req.body.email, "Bienvenue sur Feedbook " + req.body.first_name + " " + req.body.last_name + ". Votre compte vient d'être activé.", "Création de votre compte Feedbook");
                    return res.status(200).json({
                      status: 200,
                      user: user,
                      profile: profile,
                      success: true,
                      msg: 'User created successfully.'
                    });
                  });
                }
              });
            }
            }
          )}
      }).catch((err) => next(err));
    });
  });
});

module.exports = router;
