const jwtDecode = require('jwt-decode');
const router = require('express').Router();
const models = require('../models');
const bcrypt = require('bcrypt');
const config = require('../bin/config');
const tools = require('./tools');
let Sequelize = require("sequelize");
const Op = Sequelize.Op;

// TODO : FAIRE LES TESTS POUR BOOKS
// TODO : PINGDOM (ADRESSE : Feedbook.api@gmail.com) QUI CHECK
// TODO : FAIRE UN CALL POUR RECUP TOUS LES BOOKS D'UN AUTHOR PAR SON ID

// NOUVEAUTE : SYSTEM DE GRADE

router.post('/', tools.verifyToken, (req, res, next) => {
  if (req.body === undefined || !req.body.type || !req.body.title || !req.body.pdf_url || !req.body.pub_type || !req.body.description) {
    return res.status(422).json({
      status: 422,
      success: false,
      msg: 'Title, type, pdf_url, description, private and pub_type are required.'
    });
  }
  let decoded = jwtDecode(token);
  if (!decoded)
    return res.status(403).json({
      status: 403,
      success: false,
      msg: "Token is invalid."
    });
  else {
    return models.Books.findOne({
      where: {
        title: req.body.title
      }
    }).then((book) => {
      if (book)
        return res.status(409).json({
          status: 409,
          msg: "Book with same title already exist.",
          success: false
        });
      else
        return models.Users.findOne({where: {email: decoded.email}}).then((user) => {
          return models.Books.create({
            type: req.body.type,
            title: req.body.title,
            user_id: user.id,
            pdf_url: req.body.pdf_url,
            image_url: !req.body.image_url ? null : req.body.image_url,
            description: req.body.description,
            pub_type: req.body.pub_type,
            grade: 0,
            created_at: new Date()
          }).then((book) => {
            return res.status(200).json({
              status: 200,
              books: book,
              msg: "Books successfully added.",
              success: true
            });
          });
        });
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
    models.Books.findAll().then((books) => {
      return res.status(200).json({
        status: 200,
        books: books,
        success: true,
        msg: "Books retrieved successfully"
      });
    }).catch((err) => next(err));
  }
});

router.get('/page/:page', tools.verifyToken, (req, res, next) => {
  let decoded = jwtDecode(token);
  if (!decoded)
    return res.status(403).json({
      status: 403,
      success: false,
      msg: "Token is invalid"
    });
  else {
    models.Books.count().then(c => {
      models.Books.findAll({offset : (req.params.page - 1) * 20, limit: (((req.params.page - 1) * 20) + 20)}).then((books) => {
        return res.status(200).json({
          status: 200,
          page: parseInt(req.params.page), totalBooks : c,
          totalPages: c % 20 === 0 ? c / 20 : Math.floor(c / 20) + 1,
          books: books,
          success: true,
          msg: "Books retrieved successfully"
        });
      })
    }).catch(err => next(err));
  }
});

router.get('/timerange/:from/:to', tools.verifyToken, (req, res, next) => {
  let decoded = jwtDecode(token);
  if (!decoded)
    return res.status(403).json({
      status: 403,
      success: false,
      msg: "Token is invalid"});
  else {
    return models.Books.findAll({where : {
      created_at : {
        [Op.and]: {
          [Op.gte]: new Date(req.params.from),
          [Op.lte]: new Date(req.params.to)
        }
      }}
    }).then((books) => {
      return res.status(200).json({
        status: 200,
        books: books,
        success: true,
        msg: "Books retrieved successfully"
      });
    }).catch((err) => next(err));
  }
});

router.get('/search/:page', tools.verifyToken, (req, res, next) => {
  let decoded = jwtDecode(token);
  if (!decoded)
    return res.status(403).json({
      status: 403,
      success: false,
      msg: "Token is invalid"
    });
  else {
    let types = [];
    if (req.query.type && req.query.type.isArray)
      types = req.query.type;
    else
      types[0] = req.query.type;
    return models.Users.findAll({
      where: {
        username: {
          [Op.like]: '%' + req.query.author + '%'
        }
      }
    }).then((usr) => {
      if (usr) {
        let authorId = [];
        let count = 0;
        while (usr[count]) {
          authorId.push(usr[count].dataValues.id);
          count++;
        }
        return models.Books.findAndCountAll({
          where: {
            title: {
              [Op.like]: req.query.title ? '%' + req.query.title + '%' : "%%"
            },
            user_id: req.query.author ? authorId : {
              [Op.not] : null
            },
            type: types[0] ? {
              [Op.in]: types
            } : {
              [Op.not] : null
            }
          },
          offset: (req.params.page - 1) * 20,
          limit: (((req.params.page - 1) * 20) + 20),
        }).then((books) => {
          return res.status(200).json({
            status: 200, totalPages: books.count % 20 === 0 ? books.count / 20 : Math.floor(books.count / 20) + 1,
            totalBooks: books.count, books: books.rows, success: true, msg: "Books retrieved successfully"
          });
        })
      }
      else {
        return res.status(404).json({status: 404, success: false, msg: "Author not found."});          }
    }).catch((err) => next(err));
  }
});

router.delete('/:id', tools.verifyToken, (req, res, next) => {
  let decoded = jwtDecode(token);
  if (!decoded)
    return res.status(403).json({
      status: 403,
      success: false,
      msg: "Token is invalid"
    });
  return models.Books.findById(req.params.id).then((fav) => {
    if (fav)
      models.Books.destroy({
        where: {
          id: req.params.id
        }
      }).then(() => {
        return res.status(200).json({
          status: 200,
          msg: "Book successfully deleted.",
          success: true
        });
      });
    else
      return res.status(404).json({
        status: 404,
        msg: "Book with this id not found",
        success: false
      });
  }).catch((err) => next(err));
});

router.get('/:id', tools.verifyToken, (req, res, next) => {
  let decoded = jwtDecode(token);
  let currentBook;
  if (!decoded)
    return res.status(403).json({
      status: 403,
      success: false,
      msg: "Token is invalid"
    });
  else {
    models.Books.findById(req.params.id).then((book) => {
      currentBook = book;
      if (book) {
        models.Users.findById(book.user_id).then((user) => {
          return res.status(200).json({
            status: 200,
            books: currentBook,
            author: user.username,
            success: true,
            msg: "Book retrieved successfully"
          });
        });
      } else  {
        return res.status(404).json({
          status: 404,
          success: false,
          msg: "Book not found"
        });
      }
    }).catch((err) => next(err));
  }
});

router.get('/type/:type', tools.verifyToken, (req, res, next) => {
  let decoded = jwtDecode(token);
  if (!decoded)
    return res.status(403).json({
      status: 403,
      success: false,
      msg: "Token is invalid"
    });
  else {
    return models.Books.findAll({
      where: {
        type: req.params.type
      }
    }).then((books) => {
      return res.status(200).json({
        status: 200,
        books: books,
        success: true,
        msg: "Books retrieved successfully"
      });
    }).catch((err) => next(err));
  }
});

router.get('/me/public', tools.verifyToken, (req, res, next) => {
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
    }).then((usr) => {
      return models.Books.findAll({
        where: {
          user_id: usr.id,
          pub_type: "p"
        }
      }).then((books) => {
        return res.status(200).json({
          status: 200,
          books: books,
          success: true,
          msg: "Books retrieved successfully"
        });
      })
    }).catch((err) => next(err));
  }
});

router.get('/me/private', tools.verifyToken, (req, res, next) => {
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
    }).then((usr) => {
      return models.Books.findAll({
        where: {
          user_id: usr.id,
          pub_type: "v"
        }
      }).then((books) => {
        return res.status(200).json({
          status: 200,
          books: books,
          success: true,
          msg: "Books retrieved successfully"
        });
      })
    }).catch((err) => next(err));
  }
});

router.patch('/:id', tools.verifyToken, (req, res, next) => {
  let infos = {};
  if (req.body.pub_type)
    infos.pub_type = req.body.pub_type;
  if (req.body.title)
    infos.title = req.body.title;
  if (req.body.description)
    infos.description = req.body.description;
  if (req.body.type)
    infos.type = req.body.type;
  return models.Books.findByPk(req.params.id).then((book) => {
    return book.update(infos).then((book) => {
      return res.status(200).json({
        status: 200,
        book: book,
        success: true,
        msg: "Book successfully updated"
      });
    })
  })
});

//TODO : REPENSER LE SYSTEM DE NOTE, doc
router.patch('/grade/:id', (req, res, next) => {
  let decoded = jwtDecode(token);
  if (!decoded)
    return res.status(403).json({status: 403, success: false, msg: "Token is invalid"});
  else {
    models.Books.findById(req.params.id).then((book) => {

    });
  }
});

module.exports = router;
