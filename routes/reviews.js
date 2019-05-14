const router = require('express').Router();
const models = require('../models');
const config = require('../bin/config');
const tools = require('./tools');
const jwtDecode = require('jwt-decode');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
let Sequelize = require("sequelize");
const Op = Sequelize.Op;

// TODO ENVOYER MAIL A TOUS LES REVIEWERS

// TODO : FAIRE EN SORTE QUE ON NE PUISSE PAS REFAIRE UNE REVIEW REQUEST SI Y4EN A DEJA UNE ?
// TODO : FAIRE UN DELETE POUR LES REQUEST
router.post('/request/:id', tools.verifyToken, (req, res, next) => {
  let decoded = jwtDecode(token);
  if (!decoded)
    return res.status(403).json({status: 403, success: false, msg: "Token is invalid"});
  if (!req.body.end)
    return res.status(422).json({status: 422, success: false, msg: 'An end date is required.'});
  return models.Books.findByPk(req.params.id).then((book) => {
    if (book)
      return models.Users.findOne({
        where: {
          email: decoded.email
        }
      }).then((usr) => {
      console.log(usr.id + " " + book.user_id);
        if (book.user_id === usr.id)
          return models.ReviewsRequest.create({
            start: new Date(),
            book_id: req.params.id,
            end: new Date(req.body.end),
            author_id: usr.id
          }).then((request) => {
            return res.status(200).json({
              status: 200,
              success: true,
              request: request,
              msg: 'Review request successfully created.'
            });
          });
        else
          return res.status(403).json({
            status: 403,
            success: false,
            msg: 'You are not the author of this book.'
          });
      });
    else
      return res.status(404).json({
        status: 404,
        success: false,
        msg: 'This book doesn\'t exist.'
      });
  }).catch((err) => next(err));
});

router.get('/author/request', tools.verifyToken, (req, res, next) => {
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
    return models.ReviewsRequest.findAll({
      where: {
        author_id: usr.id
      }
    }).then((requests) => {
      return res.status(200).json({
        status: 200,
        success: true,
        requests: requests,
        msg: 'Review requests successfully retrieved.'
      });
    })
  }).catch((err) => next(err));
});

router.get('/reviewer/request', tools.verifyToken, (req, res, next) => {
  let decoded = jwtDecode(token);
  if (!decoded)
    return res.status(403).json({status: 403, success: false, msg: "Token is invalid"});
  return models.Users.findOne({
    where: {
      email: decoded.email
    }
  }).then((usr) => {
    return models.Reviewers.findAll({
      where: {
        reviewer_id: usr.id
      }
    }).then((reviewing) => {
      let authorId = [];
      let count = 0;
      while (reviewing[count]) {
        authorId.push(reviewing[count].dataValues.author_id);
        count++;
      }
      return models.Reviews.findAll({
        where: {
          reviewer_id: usr.id
        }
      }).then((reviews) => {
        let reviewsId = [];
        let count = 0;
        while (reviews[count]) {
          reviewsId.push(reviews[count].dataValues.review_request_id);
          count++;
        }
        return models.ReviewsRequest.findAll({
          where: {
            author_id: authorId,
            end: {
              [Op.gte]: new Date()
            },
            id: {
              [Op.notIn]: reviewsId
            }
          },
          include : [
            {
              model: models.Books,
              as: 'book',
              include : [
                {
                  model: models.Users,
                  as: 'author',
                  attributes: ['id', 'username']
                }
              ]
            }
          ]
        })
      }).then((requests) => {
        return res.status(200).json({
          status: 200,
          success: true,
          requests: requests,
          msg: 'Review requests successfully retrieved.'
        });
      });
    });
  }).catch((err) => next(err));
});

router.get('/books', tools.verifyToken, (req, res, next) => {
  let decoded = jwtDecode(token);
  if (!decoded)
    return res.status(403).json({
      status: 403,
      success: false,
      msg: "Token is invalid"
    });
  return models.Users.findOne({
    where:
      {
        email: decoded.email
      }
  }).then((usr) => {
    return models.Books.findAll({
      where: {
        user_id: usr.id
      }
    }).then((books) => {
      let booksId = [];
      for (let i = 0; books[i]; i++) {
        booksId[i] = books[i].id;
      }
      return models.Reviews.findAll({
        where: {
          book_id: booksId
        },
        attributes: ['book_id'],
        group: ['book_id']
      }).then((reviews) => {
        return res.status(200).json({
          success: true,
          msg: 'Books that you had a reviews successfully retrieved.',
          books_id: reviews
        })
      })
    })
  }).catch((err) => next(err));
});

router.post('/:id', tools.verifyToken, (req, res, next) => {
  let decoded = jwtDecode(token);
  if (!decoded)
    return res.status(403).json({
      status: 403,
      success: false,
      msg: "Token is invalid"
    });
  if (!req.body.content)
    return res.status(422).json({
      status: 422,
      success: false,
      msg: 'Missing parameter content.'
    });
  if (!req.body.grade)
    return res.status(422).json({
      status: 422,
      success: false,
      msg: 'Missing parameter grade.'
    });
  return models.Users.findOne({
    where:
      {
        email: decoded.email
      }
  }).then((usr) => {
    return models.ReviewsRequest.findByPk(req.params.id).then((request) => {
      if (request)
        return models.Reviews.findOne({
          where: {
            reviewer_id: usr.id,
            review_request_id: req.params.id
          }
        }).then((review) => {
          if (review)
            return res.status(409).json({
              status: 409,
              success: false,
              msg: 'You already did a review for this request.'
            });
          else
            return models.Reviews.create({
              created_at: new Date(),
              book_id: request.book_id,
              review_request_id: req.params.id,
              review: req.body.content,
              grade: req.body.grade,
              reviewer_id: usr.id
            }).then((review) => {
              return res.status(200).json({status: 200, success: true, review: review, msg: 'Review successfully posted.'});
            })
        });
      else
        return res.status(404).json({status: 404, success: false, msg: 'This review request doesn\'t exist.'});
    });
  }).catch((err) => next(err));
});

router.get('/author', tools.verifyToken, (req, res, next) => {
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
    return models.ReviewsRequest.findAll({
      where: {
        author_id: usr.id
      },
      include: [
        {
          model: models.Reviews,
          as: 'review'
        },
        {
          model: models.Books,
          as: 'book',
          include: [
            {
              model: models.Users,
              as: 'author',
              attributes: ['username', 'id']
            }
          ]
        }
      ],
      attributes: [
        'start', 'end'
      ]
    }).then((reviews) => {
      res.status(200).json({status: 200, success: true, msg: "Reviews successfully retrieved.", reviews: reviews});
    })
  }).catch((err) => next(err));
});

router.get('/reviewer', tools.verifyToken, (req, res, next) => {
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
    return models.Reviews.findAll({
      where: {
        reviewer_id: usr.id
      },
      include: [
        {
          model: models.Books,
          as: 'book',
          include: [
            {
              model: models.Users,
              as: 'author',
              attributes: ['username', 'id']
            }
          ]
        },
        {
          model: models.ReviewsRequest,
          as: 'request',
          attributes: ['start', 'end']
        }
      ]
    }).then((reviews) => {
      res.status(200).json({
        status: 200,
        success: true,
        msg: "Reviews successfully retrieved.",
        reviews: reviews
      });
    })
  }).catch((err) => next(err));
});

router.get('/books/:id', tools.verifyToken, (req, res, next) => {
  return models.Reviews.findAll({
    where: {
      book_id: req.params.id
    },
    include: [
      {
        model: models.Books,
        as: 'book'
      },
      {
        model: models.Users,
        as: 'reviewer',
        attributes: ['username', 'first_name', 'last_name']
      }
    ]
  }).then((reviews) => {
    return res.status(200).json({
      status: 200,
      msg: 'Reviews successfully retrieved.',
      reviews: reviews
    });
  });
});

module.exports = router;