const jwtDecode = require('jwt-decode');
const router = require('express').Router();
const models = require('../models');
const bcrypt = require('bcrypt');
const config = require('../bin/config');
const tools = require('./tools');
let Sequelize = require("sequelize");
const Op = Sequelize.Op;

// TODO : FAIRE LES TESTS POUR BOOKS
// TODO : FAIRE UN CALL DE RECHERCHE
// TODO : PINGDOM (ADRESSE : Feedbook.api@gmail.com) QUI CHECK


// NOUVEAUTE : SYSTEM DE GRADE

router.post('/', tools.verifyToken, (req, res, next) => {
  if (req.body === undefined || !req.body.type || !req.body.title || !req.body.pdf_url || !req.body.pub_type || !req.body.description) {
    return res.status(422).json({status: 422, success: false, msg: 'Title, type, pdf_url, description and pub_type are required.'});
  }
  let decoded = jwtDecode(token);
  if (!decoded)
    return res.status(403).json({status: 403, success: false, msg: "Token is invalid."});
  else {
    return models.Books.findOne({where: {title: req.body.title}}).then((book) => {
      if (book)
        return res.status(409).json({status: 409, msg: "Book with same title already exist.", success: false});
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
          }).then((fav) => {
            return res.status(200).json({status: 200, books: fav, msg: "Books successfully added.", success: true});
          });
        });
    }).catch((err) => next(err));
  }
});

router.get('/', tools.verifyToken, (req, res, next) => {
  let decoded = jwtDecode(token);
  if (!decoded)
    return res.status(403).json({status: 403, success: false, msg: "Token is invalid"});
  else {
    models.Books.findAll().then((books) => {
      return res.status(200).json({status: 200, books: books, success: true, msg: "Books retrieved successfully"});
    }).catch((err) => next(err));
  }
});

// Todo: add to doc and tests
router.get('/page/:page', tools.verifyToken, (req, res, next) => {
  let decoded = jwtDecode(token);
  if (!decoded)
    return res.status(403).json({status: 403, success: false, msg: "Token is invalid"});
  else {
    models.Books.count().then(c => {
      models.Books.findAll({offset : (req.params.page - 1) * 20, limit: (((req.params.page - 1) * 20) + 20)}).then((books) => {
        return res.status(200).json({status: 200, page: parseInt(req.params.page), totalBooks : c,
          totalPages: c % 20 === 0 ? c / 20 : Math.floor(c / 20) + 1, books: books, success: true, msg: "Books retrieved successfully"});
      })
    }).catch(err => next(err));
  }
});

router.get('/timerange/:from/:to', tools.verifyToken, (req, res, next) => {
  let decoded = jwtDecode(token);
  if (!decoded)
    return res.status(403).json({status: 403, success: false, msg: "Token is invalid"});
  else {
    return models.Books.findAll({where : {
      created_at : {
        [Op.and]: {
          [Op.gte]: new Date(req.params.from),
          [Op.lte]: new Date(req.params.to)
        }
      }}
    }).then((books) => {
      return res.status(200).json({status: 200, books: books, success: true, msg: "Books retrieved successfully"});
    }).catch((err) => next(err));
  }
});

router.get('/search/:search/:page', tools.verifyToken, (req, res, next) => {
  let decoded = jwtDecode(token);
  if (!decoded)
    return res.status(403).json({status: 403, success: false, msg: "Token is invalid"});
  else {
    return models.Books.findAndCountAll({where : {
      title : {
        [Op.like]: '%' + req.params.search + '%'
      }
    },
      offset : (req.params.page - 1) * 20,
      limit: (((req.params.page - 1) * 20) + 20),
    }).then((books) => {
      return res.status(200).json({status: 200, totalPages: books.count % 20 === 0 ? books.count / 20 : Math.floor(books.count / 20) + 1,
        totalBooks: books.count, books: books.rows, success: true, msg: "Books retrieved successfully"});
    }).catch((err) => next(err));
  }
});

router.delete('/:id', tools.verifyToken, (req, res, next) => {
  let decoded = jwtDecode(token);
  if (!decoded)
    return res.status(403).json({status: 403, success: false, msg: "Token is invalid"});
  return models.Books.findById(req.params.id).then((fav) => {
    if (fav)
      models.Books.destroy({where: {id: req.params.id}}).then(() => {
        return res.status(200).json({status: 200, msg: "Book successfully deleted.", success: true});
      });
    else
      return res.status(404).json({status: 404, msg: "Book with this id not found", success: false});
  }).catch((err) => next(err));
});

// get a book by its id
router.get('/:id', tools.verifyToken, (req, res, next) => {
  let decoded = jwtDecode(token);
  if (!decoded)
    return res.status(403).json({status: 403, success: false, msg: "Token is invalid"});
  else {
    models.Books.findById(req.params.id).then((book) => {
      return res.status(200).json({status: 200, books: book, success: true, msg: "Book retrieved successfully"});
    }).catch((err) => next(err));
  }
});

// get books by type
router.get('/type/:type', tools.verifyToken, (req, res, next) => {
  let decoded = jwtDecode(token);
  if (!decoded)
    return res.status(403).json({status: 403, success: false, msg: "Token is invalid"});
  else {
    models.Books.findAll({where: {type: req.params.type}}).then((book) => {
      return res.status(200).json({status: 200, books: book, success: true, msg: "Books retrieved successfully"});
    }).catch((err) => next(err));
  }
});

//TODO : REPENSER LE SYSTEM DE NOTE ,   doc
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
