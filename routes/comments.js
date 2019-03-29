const jwtDecode = require('jwt-decode');
const router = require('express').Router();
const models = require('../models');
const bcrypt = require('bcrypt');
const config = require('../bin/config');
const tools = require('./tools');

router.post('/', tools.verifyToken, (req, res, next) => {
  if (req.body === undefined || !req.body.content || !req.body.book_id) {
    return res.status(422).json({status: 422, success: false, msg: 'A content for the comment and the id of the book are required.'});
  }
  let decoded = jwtDecode(token);
  if (!decoded)
    return res.status(403).json({status: 403, success: false, msg: "Token is invalid."});
  else {
    return models.Users.findOne({where: {email: decoded.email}}).then((user) => {
      models.Comments.create({
        user_id: user.id,
        content: req.body.content,
        book_id: req.body.book_id
      }).then((comment) => {
        return res.status(200).json({status: 200, msg: "Comment successfully added.", success: true, comment: comment});
      })
    }).catch((err) => next(err));
  }
});

// get all comments for a book
router.get('/books/:book_id', tools.verifyToken, (req, res, next) => {
  let decoded = jwtDecode(token);
  if (!decoded)
    return res.status(403).json({status: 403, success: false, msg: "Token is invalid"});
  else {
    models.Comments.findAll({where: {book_id: req.params.book_id}, include: [{model: models.Users, as: 'user'}, {model: models.Books, as: 'book'}]}).then((comments) => {
      return res.status(200).json({status: 200, comments: comments, success: true, msg: "Comments successfully retrieved."});
    }).catch((err) => next(err));
  }
});

//TODO: tester
// get all comments for a user
router.get('/me', tools.verifyToken, (req, res, next) => {
  let decoded = jwtDecode(token);
  if (!decoded)
    return res.status(403).json({status: 403, success: false, msg: "Token is invalid"});
  else {
    return models.Users.findOne({where: {email: decoded.email}}).then((user) => {
      models.Comments.findAll({where: {user_id: user.id}}).then((comments) => {
        return res.status(200).json({
          status: 200,
          comments: comments,
          success: true,
          msg: "Comments retrieved successfully"
        });
      })
    }).catch((err) => next(err));
  }
});

// TODO : doc
router.patch('/:id', tools.verifyToken, (req, res, next) =>  {
  if (!req.body.comment)
    return res.status(422).json({status: 422, success: false, msg: 'A content for the comment.'});
  return models.Comments.findById(req.params.id).then((comment) => {
    if (comment)
      return comment.update({content: req.body.comment}).then((comment) => {
        return res.status(200).json({status: 200, msg: "Comment successfully updated", comment: comment})
      });
    else
      return res.status(404).json({status: 404, msg: "Comment with this id not found", success: false});
  }).catch((err) => next(err));
});

// TODO: tester
router.get('/:id', tools.verifyToken, (req, res, next) =>  {
  return models.Comments.findById(req.params.id).then((fav) => {
    if (fav)
      return res.status(200).json({status: 200, favorites: fav, msg: "Comment successfully retrieved.", success: true});
    else
      return res.status(404).json({status: 404, msg: "Comment with this id not found", success: false});
  }).catch((err) => next(err));
});


// TODO: tester
router.delete('/:id', tools.verifyToken, (req, res, next) =>  {
  let decoded = jwtDecode(token);
  if (!decoded)
    return res.status(403).json({status: 403, success: false, msg: "Token is invalid"});
  return models.Comments.findById(req.params.id).then((fav) => {
    if (fav)
      models.Comments.destroy({where: {id: req.params.id}}).then(() => {
        return res.status(200).json({status: 200, msg: "Comment successfully deleted.", success: true});
      });
    else
      return res.status(404).json({status: 404, msg: "Comment with this id not found", success: false});
  }).catch((err) => next(err));
});

// TODO: doc
router.delete('/books/:book_id', tools.verifyToken, (req, res, next) =>  {
  let decoded = jwtDecode(token);
  if (!decoded)
    return res.status(403).json({status: 403, success: false, msg: "Token is invalid"});
  return models.Comments.findAll({book_id : req.params.book_id}).then((fav) => {
    if (fav)
      models.Comments.destroy({where: {book_id: req.params.book_id}}).then(() => {
        return res.status(200).json({status: 200, msg: "Comments successfully deleted.", success: true});
      });
    else
      return res.status(404).json({status: 404, msg: "Comments with this id not found", success: false});
  }).catch((err) => next(err));
});

module.exports = router;