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
              return models.ReviewersRequest.destroy({
                where: {
                  author_id: usr.id,
                  user_id: reviewerId,
                }
              }).then(() => {
                return res.status(200).json({
                  status: 200,
                  reviewer: reviewer,
                  msg: "Reviewer successfully add.",
                  success: true
                });
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
              return models.ReviewersRequest.destroy({
                where: {
                  author_id: usr.id,
                  user_id: req.body.reviewer_id
                }
              }).then(() => {
                return res.status(200).json({
                  status: 200,
                  message: msg,
                  msg: "Reviewer successfully add.",
                  success: true
                });
              });
            });
        });
      });
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
              return models.ReviewersRequest.destroy({
                where: {
                  author_id: usr.id,
                  user_id: reviewerId
                }
              }).then(() => {
                return res.status(200).json({
                  status: 200,
                  message: msg,
                  msg: "Reviewer successfully add.",
                  success: true
                });
              });
            });
        });
      });
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
      where: {
        author_id: usr.id
      },
      include: [
        {
          model: models.Users, as: 'reviewer',
          attributes: ['username', 'email', 'last_login', 'date_joined', 'first_name', 'last_name', 'is_staff', 'is_active', 'is_superuser', 'id']
        }
      ]
    }).then((reviewers) => {
      return res.status(200).json({
        status: 200,
        success: true,
        msg: "Reviewers successfully retrieved.",
        reviewers: reviewers
      });
    });
  }).catch((err) => next(err));
});

// retrieve all author that I can review when i'm a lecturer
router.get('/reviewing', tools.verifyToken, (req, res, next) => {
  let decoded = jwtDecode(token);
  if (!decoded)
    return res.status(403).json({status: 403, success: false, msg: "Token is invalid"});
  return models.Users.findOne({
    where: {
      email: decoded.email
    }
  }).then((usr) => {
    return models.Reviewers.findAll({
      where: {reviewer_id: usr.id},
      include: [
        {
          model: models.Users, as: 'author',
          attributes: ['username', 'email', 'last_login', 'date_joined', 'first_name', 'last_name', 'is_staff', 'is_active', 'is_superuser', 'id'
          ]
        }
      ]
    }).then((reviewers) => {
      return res.status(200).json({
        status: 200,
        success: true,
        msg: "Author that you are reviewing successfully retrieved.",
        reviewers: reviewers
      });
    });
  }).catch((err) => next(err));
});

router.get('/teams/me', tools.verifyToken, (req, res, next) => {
  let decoded = jwtDecode(token);
  if (!decoded)
    return res.status(403).json({
      status: 403,
      success: false,
      msg: "Token is invalid"
    });
  return models.Users.findOne({
    where: {
      email: decoded.email
    }
  }).then((usr) => {
    return models.Reviewers.findAll({
      include: [
        {
          model: models.Users,
          as: 'author',
          attributes: ['username', 'email', 'last_login', 'date_joined', 'first_name', 'last_name', 'is_staff', 'is_active', 'is_superuser', 'id']
        },
        {
          model: models.Users, as: 'reviewer',
          attributes: ['username', 'email', 'last_login', 'date_joined', 'first_name', 'last_name', 'is_staff', 'is_active', 'is_superuser', 'id']
        }
      ]
    }).then((reviewers) => {
      let reviewersTeam = [];
      let myReviewersTeam = [{reviewers_team: []}];
      let checkIfTeamExist = (author_id) => {
        for (let i = 0; reviewersTeam[i]; i++) {
          if (reviewersTeam[i].author_id === author_id)
            return true;
        }
        return false;
      };
      for (let i = 0; reviewers[i]; i++) {
        if (!checkIfTeamExist(reviewers[i].author_id))
          reviewersTeam.push({
            total_reviewers: 0,
            author_id: reviewers[i].author_id,
            author: reviewers[i].author,
            reviewers: []
          })
      }
      for (let i = 0; reviewers[i]; i++) {
        let team = reviewersTeam.find(team => team.author_id === reviewers[i].author_id);
        team.reviewers.push(reviewers[i].reviewer);
        team.total_reviewers += 1;
      }
      for (let i = 0; reviewersTeam[i]; i++) {
        for (let j = 0; reviewersTeam[i].reviewers[j]; j++) {
          if (reviewersTeam[i].reviewers[j].id === usr.id) {
            myReviewersTeam.push({
              reviewers_team: reviewersTeam[i]
            })
          }
        }
      }
      return res.status(200).json({
        status: 200,
        msg: 'Your reviewers team successfully retrieved.',
        reviewers_team: myReviewersTeam
      });
    });
  }).catch((err) => next(err));
});

router.get('/teams', tools.verifyToken, (req, res, next) => {
  let decoded = jwtDecode(token);
  let reviewersTeams = [];
  if (!decoded)
    return res.status(403).json({
      status: 403,
      success: false,
      msg: "Token is invalid"
    });
  return models.Users.findOne({
    where: {
      email: decoded.email
    }
  }).then((usr) => {
    return models.Books.findAll({
      include: [
        {
          model: models.Users,
          as: 'author',
          attributes: ['username', 'id', 'first_name', 'last_name']
        }
      ],
      group: ['user_id']
    }).then((books) => {
      for (let i = 0; books[i]; i++) {
        reviewersTeams.push({
          author_id: books[i].user_id,
          total_reviewers: 0,
          author: books[i].author,
          status: 0,
          my_reviewer_id: 0,
          reviewers: []
        });
      }
      return models.Reviewers.findAll({
        include: [
          {
            model: models.Users,
            as: 'author',
            attributes: ['username', 'email', 'last_login', 'date_joined', 'first_name', 'last_name', 'is_staff', 'is_active', 'is_superuser', 'id']
          },
          {
            model: models.Users, as: 'reviewer',
            attributes: ['username', 'email', 'last_login', 'date_joined', 'first_name', 'last_name', 'is_staff', 'is_active', 'is_superuser', 'id']
          }
      ]
      }).then((reviewers) => {
        for (let i = 0; reviewers[i]; i++) {
          let team = reviewersTeams.find(team => team.author_id === reviewers[i].author_id);
          if (team) {
            team.reviewers.push(reviewers[i].reviewer);
            team.total_reviewers += 1;
            if (reviewers[i].reviewer_id === usr.id) { // user is already a reviewer
              team.status = 2;
              team.my_reviewer_id = reviewers[i].id;
            }
          }
        }
        return models.ReviewersRequest.findAll({
          where: {
            user_id: usr.id
          }
        }).then((requests) => {
          for (let i = 0; requests[i]; i++) {
            let team = reviewersTeams.find(team => team.author_id === requests[i].author_id && requests[i].user_id === usr.id);
            if (team && team.status !== 2) // user is pending
              team.status = 1;
          }
          return res.status(200).json({
            status: 200,
            msg: 'Teams successfully retrieved.',
            reviewers_teams: reviewersTeams
          });
        });
      });
    });
  }).catch((err) => next(err));
});

// TODO : THIS ENDPOINT JUST RETURNS TEAMS WITH REVIEWER IN IT | NOT IN THE DOC !!!
router.get('/', tools.verifyToken, (req, res, next) => {
  let decoded = jwtDecode(token);
  if (!decoded)
    return res.status(403).json({
      status: 403,
      success: false,
      msg: "Token is invalid"
    });
    return models.Reviewers.findAll({
      include: [
        {
          model: models.Users,
          as: 'author',
          attributes: ['username', 'email', 'last_login', 'date_joined', 'first_name', 'last_name', 'is_staff', 'is_active', 'is_superuser', 'id']
        },
        {
          model: models.Users, as: 'reviewer',
          attributes: ['username', 'email', 'last_login', 'date_joined', 'first_name', 'last_name', 'is_staff', 'is_active', 'is_superuser', 'id']
        }
      ]
    }).then((reviewers) => {
      let reviewersTeam = [];
      let checkIfTeamExist = (author_id) => {
        for (let i = 0; reviewersTeam[i]; i++) {
          if (reviewersTeam[i].author_id === author_id)
            return true;
        }
        return false;
      };
      for (let i = 0; reviewers[i]; i++) {
        if (!checkIfTeamExist(reviewers[i].author_id))
          reviewersTeam.push({
            total_reviewers: 0,
            author_id: reviewers[i].author_id,
            author: reviewers[i].author,
            reviewers: []
          })
      }
      for (let i = 0; reviewers[i]; i++) {
        let team = reviewersTeam.find(team => team.author_id === reviewers[i].author_id);
        team.reviewers.push(reviewers[i].reviewer);
        team.total_reviewers += 1;
      }
      return res.status(200).json({
        status: 200,
        msg: 'Reviewers team successfully retrieved.',
        reviewers_team: reviewersTeam
      });
  }).catch((err) => next(err));
});

router.post('/request', tools.verifyToken, (req, res, next) => {
  let decoded = jwtDecode(token);
  if (!req.body.author_id)
    return res.status(422).json({status: 422, success: false, msg: 'Missing parameter author_id.'});
  if (!decoded)
    return res.status(403).json({status: 403, success: false, msg: "Token is invalid"});
  return models.Users.findOne({
    where: {
      email: decoded.email
    }
  }).then((usr) => {
    return models.ReviewersRequest.findOne({
      where: {
        user_id: usr.id,
        author_id: req.body.author_id
      }
    }).then((request) => {
      if (request)
        return res.status(409).json({
          status: 409,
          msg: "You already have requested to become a reviewer of this author.",
          success: false
        });
      return models.ReviewersRequest.create({
        user_id: usr.id,
        author_id: req.body.author_id,
        created_at: new Date()
      }).then((reviewerReq) => {
        return res.status(200).json({
          status: 200,
          msg: 'Reviewers request successfully created.',
          reviewer_request: reviewerReq
        });
      });
    });
  }).catch((err) => next(err));
});

router.get('/request/me', tools.verifyToken, (req, res, next) => {
  let decoded = jwtDecode(token);
  if (!decoded)
    return res.status(403).json({status: 403, success: false, msg: "Token is invalid"});
  return models.Users.findOne({
    where: {
      email: decoded.email
    }
  }).then((usr) => {
    return models.ReviewersRequest.findAll({
      where: {
        author_id: usr.id
      },
      include: [
        {
          model: models.Users,
          as: 'user',
          attributes: ['username', 'id', 'first_name', 'last_name', 'profile_picture']
        }
      ]
    }).then((reviewersReq) => {
      return res.status(200).json({
        status: 200,
        msg: 'Reviewers request successfully retrieved.',
        reviewer_request: reviewersReq
      });
    });
  }).catch((err) => next(err));
});

router.delete('/request/:authorid', tools.verifyToken, (req, res, next) => {
  let decoded = jwtDecode(token);
  if (!decoded)
    return res.status(403).json({status: 403, success: false, msg: "Token is invalid"});
  return models.Users.findOne({
    where: {
      email: decoded.email
    }
  }).then((usr) => {
    return models.ReviewersRequest.findOne({
      where: {
        author_id: req.params.authorid,
        user_id: usr.id
      }
    }).then((reviewerReq) => {
      if (!reviewerReq) {
        return res.status(404).json({
          status: 404,
          msg: 'You don\'t have a request for this author',
          success: false
        })
      } else {
        return models.ReviewersRequest.destroy({
          where: {
            author_id: req.params.authorid,
            user_id: usr.id
          }
        }).then(() => {
          return res.status(200).json({
            status: 200,
            msg: 'Request successfully deleted.',
            success: true
          })
        })
      }
    });
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