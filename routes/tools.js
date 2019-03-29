const jwt = require('jsonwebtoken');
const config = require('../bin/config');
var exports = module.exports = {};
const nodemailer = require('nodemailer');

exports.verifyToken = (req, res, next) => {
    token = req.headers.authorization;
  if (!token)
		return res.status(422).json({status: 422, success: false, msg: 'No token has been send' });
  jwt.verify(token, config.secret, function(err, decoded) {
    if (err)
      return res.status(401).json({status: 401, success: false, msg: "Invalid token"});
    req.userId = decoded.mail;
    next();
  });
};

exports.sendMail = (to, content, subject) => {
  var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'feedbook.api@gmail.com',
      pass: 'r?2/r8sE'
    }
  });

  var mailOptions = {
    from: 'feedbook.api@gmail.com',
    to: to,
    subject: subject,
    text: content
  };

  transporter.sendMail(mailOptions, function(error, info){
    if (error) {
      console.log(error);
    } else {
      console.log('Email sent: ' + info.response);
    }
  });
};

return exports;
