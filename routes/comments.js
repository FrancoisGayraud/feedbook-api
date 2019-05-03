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
        book_id: req.body.book_id,
        created_at: new Date()
      }).then((comment) => {
        return res.status(200).json({status: 200, msg: "Comment successfully added.", success: true, comment: comment});
      })
    }).catch((err) => next(err));
  }
});

// get all comments for a book
// TODO CHANGER LA DOC, MOINS DE DATA DANS USER DE L'INCLUDE
router.get('/books/:book_id', tools.verifyToken, (req, res, next) => {
  let decoded = jwtDecode(token);
  if (!decoded)
    return res.status(403).json({status: 403, success: false, msg: "Token is invalid"});
  else {
    return models.Comments.findAll({where: {book_id: req.params.book_id}, include: [{model: models.Users, as: 'user', attributes: ['username', 'email', 'last_login', 'date_joined', 'first_name', 'last_name', 'is_staff', 'is_active', 'is_superuser', 'id']},
      {model: models.Books, as: 'book'}]}).then((comments) => {
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

router.patch('/:id', tools.verifyToken, (req, res, next) =>  {
  if (!req.body.content)
    return res.status(422).json({status: 422, success: false, msg: 'A content for the comment is required.'});
  return models.Comments.findById(req.params.id).then((comment) => {
    if (comment)
      return comment.update({content: req.body.content}).then((comment) => {
        return res.status(200).json({status: 200, msg: "Comment successfully updated", comment: comment})
      });
    else
      return res.status(404).json({status: 404, msg: "Comment with this id not found", success: false});
  }).catch((err) => next(err));
});

// TODO: tester
router.get('/:id', tools.verifyToken, (req, res, next) =>  {
  return models.Comments.findById(req.params.id).then((comment) => {
    if (comment)
      return res.status(200).json({status: 200, comment: comment, msg: "Comment successfully retrieved.", success: true});
    else
      return res.status(404).json({status: 404, msg: "Comment with this id not found", success: false});
  }).catch((err) => next(err));
});


// TODO: tester
router.delete('/:id', tools.verifyToken, (req, res, next) =>  {
  let decoded = jwtDecode(token);
  if (!decoded)
    return res.status(403).json({status: 403, success: false, msg: "Token is invalid"});
  return models.Comments.findById(req.params.id).then((comment) => {
    if (comment)
      models.Comments.destroy({where: {id: req.params.id}}).then(() => {
        return res.status(200).json({status: 200, msg: "Comment successfully deleted.", success: true});
      });
    else
      return res.status(404).json({status: 404, msg: "Comment with this id not found", success: false});
  }).catch((err) => next(err));
});

router.delete('/books/:book_id', tools.verifyToken, (req, res, next) =>  {
  let decoded = jwtDecode(token);
  if (!decoded)
    return res.status(403).json({status: 403, success: false, msg: "Token is invalid"});
  return models.Comments.findAll({book_id : req.params.book_id}).then((comment) => {
    if (comment)
      models.Comments.destroy({where: {book_id: req.params.book_id}}).then(() => {
        return res.status(200).json({status: 200, msg: "Comments for this book successfully deleted.", success: true});
      });
    else
      return res.status(404).json({status: 404, msg: "No comments for this book.", success: false});
  }).catch((err) => next(err));
});

module.exports = router;