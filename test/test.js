//During the test the env variable is set to test
process.env.NODE_ENV = 'test';

//Require the dev-dependencies
let chai = require('chai');
let chaiHttp = require('chai-http');
let server = require('../app');
let should = chai.should();
let expect = require('chai').expect;
let models = require("../models");

server.listen(3000);

chai.use(chaiHttp);
let user_token;

describe('### API TESTS ###', function(){
  this.timeout(3000);

  before(function(done) {

  });

  models.Users.findOne({mail:'test@api.com'}).then((user) => {
    user_token = user.token;
    require('./auth')(user_token);
    require('./profile')(user_token);
    require('./favorite')(user_token);
  })
});


