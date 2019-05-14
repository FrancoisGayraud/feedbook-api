const router = require('express').Router();
const models = require('../models');
const config = require('../bin/config');
const tools = require('./tools');
const jwtDecode = require('jwt-decode');
let Sequelize = require("sequelize");
const Op = Sequelize.Op;


// TODO FAIRE UN ENDPOINT POUR RECUP LES USER POUR AVOIR LES ID

// TODO : DELETE A MESSAGE

router.post('/', tools.verifyToken, (req, res, next) => {
  let receiverId;
  let decoded = jwtDecode(token);
  if (!decoded)
    return res.status(403).json({
      status: 403,
      success: false,
      msg: "Token is invalid"
    });
  if (!req.body.content) {
    return res.status(422).json({
      status: 422,
      success: false,
      msg: 'Missing parameter content.'
    });
  }
  if (!req.body.receiver_id && !req.body.username && !req.body.email) {
    return res.status(422).json({
      status: 422,
      success: false,
      msg: 'Missing parameter receiver_id or username or email.'
    });
  }
  if (req.body.username) {
    return models.Users.findOne({
      where: {
        username: req.body.username
      }
    }).then((usr) => {
      if (!usr)
        return res.status(404).json({
          status: 404,
          msg: 'No user with this username were found',
          success: false
        });
      else {
        receiverId = usr.id;
        return models.Users.findOne({
          where: {
            email: decoded.email
          }
        }).then((usr) => {
          return models.Messages.create({
            receiver_id: receiverId,
            content: req.body.content,
            sender_id: usr.id,
            subject: req.body.subject,
            sent_at: new Date()
          }).then((msg) => {
            return res.status(200).json({
              status: 200,
              message: msg,
              msg: "Messages successfully sent.", success: true
            });
          })
        })
      }
    }).catch((err) => next(err));
  } else if (req.body.receiver_id) {
    return models.Users.findOne({
      where: {
        email: decoded.email
      }
    }).then((usr) => {
      return models.Users.findByPk(req.body.receiver_id).then((receiver) => {
        if (!receiver)
          return res.status(404).json({
            status: 404,
            msg: 'No user with this id were found',
            success: false
          });
        else
          return models.Messages.create({
            receiver_id: req.body.receiver_id,
            content: req.body.content,
            sender_id: usr.id,
            subject: req.body.subject,
            sent_at: new Date()
          }).then((msg) => {
            return res.status(200).json({
              status: 200,
              message: msg,
              msg: "Messages successfully sent.",
              success: true
          });
          })
      })
    }).catch((err) => next(err));
  } else if (req.body.email) {
    return models.Users.findOne({
      where: {
        email: req.body.email
      }
    }).then((usr) => {
      receiverId = usr.id;
      return models.Users.findOne({
        where: {
          email: decoded.email
        }
      }).then((usr) => {
        return models.Messages.create({
          receiver_id: receiverId,
          content: req.body.content,
          sender_id: usr.id,
          subject: req.body.subject,
          sent_at: new Date()
        }).then((msg) => {
          return res.status(200).json({
            status: 200,
            message: msg,
            msg: "Messages successfully sent.",
            success: true
          });
        })
      })
    }).catch((err) => next(err));
  }
});

router.get('/conversations/:page', tools.verifyToken, (req, res, next) => {
  let decoded = jwtDecode(token);
  let usersId = [];
  let lastMgs = [];
  let count = 0;
  let userId;

  return models.Users.findOne({
    where: {
      email: decoded.email
    }
  }).then((usr) => {
    userId = usr.dataValues.id;
    return models.Messages.findAll({
      where: {
        [Op.or]: [
          {
            receiver_id: usr.dataValues.id
          },
          {
            sender_id: usr.dataValues.id
          }
        ]
      },
      attributes: ['sender_id', 'receiver_id', 'id', 'content', 'sent_at'],
      order: [['sent_at', 'DESC']]
    }).then((msgs) => {
      if (msgs[0]) {
        for (let i = 0; msgs[i]; i++) {
          if (!usersId.includes(msgs[i].dataValues.sender_id) && msgs[i].dataValues.sender_id !== userId) {
            usersId[count] = msgs[i].dataValues.sender_id;
            lastMgs[count] = msgs[i];
            count++;
          } else if (!usersId.includes(msgs[i].dataValues.receiver_id) && msgs[i].dataValues.receiver_id !== userId) {
            usersId[count] = msgs[i].dataValues.receiver_id;
            lastMgs[count] = msgs[i];
            count++;
          }
        }
        return models.Users.findAll({
          where: {
            id: {
              [Op.in]: usersId
            }
          },
          attributes: ['id', 'username']
        }).then((users) => {
          let conversations = [];
          for (let i = (req.params.page * 10) - 10; lastMgs[i] && i < req.params.page * 10; i++) {
            conversations.push({
              user: users.find(user => user.id === lastMgs[i].sender_id || user.id === lastMgs[i].receiver_id),
              last_message: lastMgs[i]
            })
          }
          return res.status(200).json({
            status: 200,
            msg: 'Conversations successfully retrieved',
            conversations: conversations,
            totalPages: usersId.length % 10 === 0 ? usersId.length / 10 : Math.floor(usersId.length / 10) + 1,
            totalConversation: usersId.length,
            success: true
          })
        })
      } else {
        return res.status(404).json({
          status: 404,
          msg: 'No conversation were found',
          success: false
        })
      }
    })
  }).catch((err) => next(err));
});

router.get('/conversations/:id/:page', tools.verifyToken, (req, res, next) => {
  let decoded = jwtDecode(token);
  return models.Users.findOne({
    where: {
      email: decoded.email
    }
  }).then((usr) => {
    return models.Messages.findAndCountAll({
      where: {
        [Op.or]: [
          {
            receiver_id: usr.dataValues.id,
            sender_id: req.params.id
          },
          {
            receiver_id: req.params.id,
            sender_id: usr.dataValues.id
          }
        ]
      },
      include: [
        {
          model: models.Users,
          as: 'receiver',
          attributes: ['username', 'first_name', 'last_name']
        },
        {
          model: models.Users,
          as: 'sender',
          attributes: ['username', 'first_name', 'last_name']
        }
      ],
      offset: (req.params.page - 1) * 10,
      limit: 10,
      order: [['sent_at', 'DESC']]
    }).then((msgs) => {
      if (!msgs.rows[0])
        return res.status(404).json({
          status: 404,
          msg: 'No messages with this user.',
          success: false
        });
      else
        return res.status(200).json({
          status: 200,
          msg: 'Conversation successfully retrieved.',
          conversation: msgs.rows,
          totalPages: msgs.count % 10 === 0 ? msgs.count / 10 : Math.floor(msgs.count / 10) + 1,
          totalMessages: msgs.count
        })
    })
  }).catch((err) => next(err));
});

router.get('/', tools.verifyToken, (req, res, next) => {
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
    return models.Messages.findAll({
      where: {
        [Op.or]: [
          {
            receiver_id: usr.dataValues.id
          },
          {
            sender_id: usr.dataValues.id
          }
        ],
      },
      include: [
        {
          model: models.Users,
          as: 'receiver',
          attributes: ['username', 'first_name', 'last_name']
        }
      ],
    }).then((msgs) => {
      return res.status(200).json({
        status: 200,
        messages: msgs,
        msg: "Messages successfully retrieved.",
        success: true
      });
    })
  }).catch((err) => next(err));
});

router.delete('/conversations/:id', tools.verifyToken, (req, res, next) => {
  let decoded = jwtDecode(token);
  return models.Users.findOne({
    where: {
      email: decoded.email
    }
  }).then((usr) => {
    return models.Messages.findAll({
      where: {
        [Op.or]: [
          {
            receiver_id: usr.dataValues.id,
            sender_id: req.params.id
          },
          {
            receiver_id: req.params.id,
            sender_id: usr.dataValues.id
          }
        ]
      }
    }).then((msgs) => {
      if (!msgs[0])
        return res.status(404).json({
          status: 404,
          msg: 'No messages with this user.',
          success: false
        });
      else
        return models.Messages.destroy({
          where: {
            [Op.or]: [
              {
                receiver_id: usr.dataValues.id,
                sender_id: req.params.id
              },
              {
                receiver_id: req.params.id,
                sender_id: usr.dataValues.id
              }
            ]
          }
        }).then(() => {
          res.status(200).json({
            status: 200,
            msg: 'Conversation successfully delete.',
            success: true
          })
        })
    }).catch((err) => next(err));
  })
});

router.delete('/:id', tools.verifyToken, (req, res, next) => {
  return models.Messages.findByPk(req.params.id).then((msg) => {
    if (msg)
      return models.Messages.destroy({
        where: {
          id: req.params.id
        }
      }).then(() => {
        return res.status(200).json({
          status: 200,
          success: true,
          msg: 'Message successfully deleted.'
        });
      });
    else
      res.status(400).json({
        status: 400,
        success: false,
        msg: 'Message not found'
      })
  }).catch((err) => next(err));
});

module.exports = router;