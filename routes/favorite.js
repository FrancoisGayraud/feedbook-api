const router = require('express').Router();
const models = require('../models');
const config = require('../bin/config');
const tools = require('./tools');
const jwtDecode = require('jwt-decode');

router.get('/me/public/:page', tools.verifyToken, (req, res, next) => {
  let decoded = jwtDecode(token);
  if (!decoded)
    return res.status(403).json({
      status: 403,
      success: false,
      msg: "Token is invalid"
    });
  else {
    return models.Users.findOne({
      where : {
        email: decoded.email
      }
    }).then((user) => {
      models.Favorites.findAndCountAll({
        where: {
          user_id: user.id,
          pub_type: "p"
        },
        include : [
          {
            model: models.Books,
            as: 'book',
            include: [
              {
                model: models.Users,
                as: 'author',
                attributes: ['username', 'id', 'first_name', 'last_name']
              }
            ]
          }
        ],
        offset: (req.params.page - 1) * 20,
        limit: 20,
      }).then((fav) => {
        return res.status(200).json({
          status: 200,
          favorites: fav.rows,
          msg: "User favorites successfully retrieved.",
          totalPages: fav.count % 20 === 0 ? fav.count / 20 : Math.floor(fav.count / 20) + 1,
          totalFavorites: fav.count,
          success: true
        });
      });
    }).catch((err) => next(err));
  }
});

router.get('/me/private/:page', tools.verifyToken, (req, res, next) => {
  let decoded = jwtDecode(token);
  if (!decoded)
    return res.status(403).json({
      status: 403,
      success: false,
      msg: "Token is invalid"
    });
  else {
    return models.Users.findOne({
      where : {
        email: decoded.email
      }
    }).then((user) => {
      models.Favorites.findAndCountAll({
        where: {
          user_id: user.id,
          pub_type: "v"
        },
        include : [
          {
            model: models.Books,
            as: 'book',
            include: [
              {
                model: models.Users,
                as: 'author',
                attributes: ['username', 'id', 'first_name', 'last_name']
              }
            ]
          }
        ],
        offset: (req.params.page - 1) * 20,
        limit: 20,
      }).then((fav) => {
        return res.status(200).json({
          status: 200,
          favorites: fav.rows,
          msg: "User favorites successfully retrieved.",
          totalPages: fav.count % 20 === 0 ? fav.count / 20 : Math.floor(fav.count / 20) + 1,
          totalFavorites: fav.count,
          success: true
        });
      });
    }).catch((err) => next(err));
  }
});

router.get('/me/all/:page', tools.verifyToken, (req, res, next) => {
  let decoded = jwtDecode(token);
  if (!decoded)
    return res.status(403).json({
      status: 403,
      success: false,
      msg: "Token is invalid"
    });
  else {
    return models.Users.findOne({
      where : {
        email: decoded.email
      }
    }).then((user) => {
      models.Favorites.findAndCountAll({
        where: {
          user_id: user.id
        },
        include : [
          {
            model: models.Books,
            as: 'book',
            include: [
              {
                model: models.Users,
                as: 'author',
                attributes: ['username', 'id', 'first_name', 'last_name']
              }
            ]
          }
        ],
        offset: (req.params.page - 1) * 20,
        limit: 20,
      }).then((fav) => {
        return res.status(200).json({
          status: 200,
          totalPages: fav.count % 20 === 0 ? fav.count / 20 : Math.floor(fav.count / 20) + 1,
          totalFavorites: fav.count,
          favorites: fav.rows,
          msg: "User favorites successfully retrieved.",
          success: true
        });
      });
    }).catch((err) => next(err));
  }
});

router.get('/me/all', tools.verifyToken, (req, res, next) => {
  let decoded = jwtDecode(token);
  if (!decoded)
    return res.status(403).json({
      status: 403,
      success: false,
      msg: "Token is invalid"
    });
  else {
    return models.Users.findOne({
      where : {
        email: decoded.email
      }
    }).then((user) => {
      models.Favorites.findAll({
        where: {
          user_id: user.id
        },
        include : [
          {
            model: models.Books,
            as: 'book',
            include: [
              {
                model: models.Users,
                as: 'author',
                attributes: ['username', 'id', 'first_name', 'last_name']
              }
            ]
          }
        ]
      }).then((fav) => {
        return res.status(200).json({
          status: 200,
          favorites: fav,
          msg: "User favorites successfully retrieved.",
          success: true
        });
      });
    }).catch((err) => next(err));
  }
});

router.post('/:id', tools.verifyToken, (req, res, next) => {
  let decoded = jwtDecode(token);
  let updateBook;
  if (!decoded)
    return res.status(403).json({
      status: 403,
      success: false,
      msg: "Token is invalid"
    });
  else {
    return models.Books.findOne({
      where: {
        id: req.params.id
      }
    }).then((book) => {
      if (book) {
        updateBook = book;
        return models.Users.findOne({
          where: {
            email: decoded.email
          }
        }).then((user) => {
          return models.Favorites.findOne({
              where: {
                user_id: user.id,
                book_id: book.id
              }
            }
          ).then((fav) => {
            if (!fav)
              return updateBook.update({
                count_fav: updateBook.count_fav + 1
              }).then(() => {
                return models.Favorites.create({
                  type: book.type,
                  title: book.title,
                  user_id: user.id,
                  book_id: book.id,
                  pub_type: "v"
                }).then((fav) => {
                  return res.status(200).json({
                    status: 200,
                    favorites: fav,
                    msg: "User favorite successfully added.",
                    success: true
                  });
                });
              });
            else
              return res.status(409).json({
                status: 409,
                msg: "User already has this book in favorite.",
                success: false
              });
          });
        })
      }
      else
        return res.status(404).json({
          status: 404,
          msg: "Book not found.",
          success: false
        });
    }).catch((err) => next(err));
  }
});

router.patch('/:id', tools.verifyToken, (req, res, next) => {
  let userId;
  if (!req.body.pub_type) {
    return res.status(422).json({
      status: 422,
      success: false,
      msg: 'Missing parameter pub_type.'
    });
  }
  let decoded = jwtDecode(token);
  if (!decoded)
    return res.status(403).json({
      status: 403,
      success: false,
      msg: "Token is invalid"
    });
  return models.Users.findOne({
    where : {
      email: decoded.email
    }
  }).then((usr) => {
    userId = usr.dataValues.id;
    return models.Favorites.findByPk(req.params.id).then((fav) => {
      if (!fav) {
        return res.status(404).json({
          status: 404,
          msg: 'Favorite not found.',
          success: false
        })
      } else if (fav.dataValues.user_id !== userId) {
        return res.status(403).json({
          status: 403,
          success: false,
          msg: 'This favorite doesn\'t belong to you'
        })
      } else {
        fav.update({
          pub_type: req.body.pub_type
        }).then((favorite) => {
          return res.status(200).json({
            status: 200,
            success: true,
            favorites: favorite,
            msg: "Favorite successfully patched."
          })
        })
      }
    })
  }).catch((err) => next(err));
});

router.delete('/:id', tools.verifyToken, (req, res, next) =>  {
  let decoded = jwtDecode(token);
  if (!decoded)
    return res.status(403).json({
      status: 403,
      success: false,
      msg: "Token is invalid"
    });
  return models.Users.findOne({
    where : {
      email: decoded.email
    }
  }).then((usr) => {
    return models.Favorites.findOne({
      where: {
        book_id: req.params.id,
        user_id: usr.id
      }
    }).then((fav) => {
      if (fav) {
        return models.Favorites.destroy({
          where: {
            book_id: req.params.id,
            user_id: usr.id
          }
        }).then(() => {
          models.Books.findByPk(fav.book_id)
            .then((book) => {
            book.update({
              count_fav: book.count_fav - 1
            }).then(() => {
              return res.status(200).json({
                status: 200,
                msg: "Favorite successfully deleted.",
                success: true
              });
            });
          });
        });
      }
      else
        return res.status(404).json({
          status: 404,
          msg: "User doesn't have this book in favorite.",
          success: false
        });
    });
  }).catch((err) => next(err));
});

router.get('/:id', tools.verifyToken, (req, res, next) =>  {
  return models.Favorites.findById(req.params.id,
    {
      include : [
        {
          model: models.Books,
          as: 'book',
          include: [
            {
              model: models.Users,
              as: 'author',
              attributes: ['username', 'id', 'first_name', 'last_name']
            }
          ]
        }
      ]
    }).then((fav) => {
    if (fav)
      return res.status(200).json({
        status: 200,
        favorite: fav,
        msg: "Favorite successfully retrieved.",
        success: true
      });
    else
      return res.status(404).json({
        status: 404,
        msg: "Favorite with this id not found",
        success: false
      });
  }).catch((err) => next(err));
});

router.get('/books/:id', tools.verifyToken, (req, res, next) =>  {
  let decoded = jwtDecode(token);
  if (!decoded)
    return res.status(403).json({
      status: 403,
      success: false,
      msg: "Token is invalid"
    });
  return models.Users.findOne({
    where : {
      email: decoded.email
    }
  }).then((usr) => {
    return models.Favorites.findOne({
      where: {
        user_id: usr.id,
        book_id: req.params.id
      },
      include : [
        {
          model: models.Books,
          as: 'book',
          include: [
            {
              model: models.Users,
              as: 'author',
              attributes: ['username', 'id', 'first_name', 'last_name']
            }
          ]
        }
      ]
    }).then((fav) => {
      if (!fav)
        return res.status(404).json({
          status: 404,
          msg: 'Favorite not found.',
          success: false
        });
      else
        return res.status(200).json({
          status: 200,
          msg: 'Favorite successfully retrieved.',
          favorite: fav
        });
    });
  }).catch((err) => next(err));
});

module.exports = router;