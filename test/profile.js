
//Require the dev-dependencies
let chai = require('chai');
let chaiHttp = require('chai-http');
let server = require('../app');
let should = chai.should();
let expect = require('chai').expect;


chai.use(chaiHttp);
//Our parent block
module.exports = function (user_token){

console.log("le token est +++++++ " + user_token)



//get profile user with valid token
describe('PROFILE', () => {
    describe('/GET profile', () => {
      it('get profile user with valid token', (done) => {
        chai.request('http://localhost:3000/api/v1/profile')
          .get('/me')
          .set({authorization: user_token})
          .end((err, res) => {
            res.should.have.status(200);
            done();
          });
      });
    });
});

//get specific user with invalid token
describe('PROFILE', () => {
    describe('/GET profile', () => {
      it('get specific user with invalid token', (done) => {
        chai.request('http://localhost:3000/api/v1/profile')
          .get('/users')
          .set({authorization: 'ttoto'})
          .end((err, res) => {
            res.should.have.status(401);
            done();
          });
      });
    });
});

//get profile user with invalid token
describe('PROFILE', () => {
    describe('/GET profile', () => {
      it('get profile user with invalid token', (done) => {
        chai.request('http://localhost:3000/api/v1/profile')
          .get('/me')
          .set({authorization: "adadadad"})
          .end((err, res) => {
            res.should.have.status(401);
            done();
          });
      });
    });
});

//patch valid users
describe('PROFILE', () => {
    describe('/patch profile', () => {
      it('patch valid user', (done) => {
        chai.request('http://localhost:3000/api/v1/profile')
          .get('/me')
          .set({authorization: user_token})
          .send({firstname: "testeur"})
          .end((err, res) => {
            res.should.have.status(200);
            done();
          });
      });
    });
});

//patch invalid token
describe('PROFILE', () => {
    describe('/patch profile', () => {
      it('patch invalid token', (done) => {
        chai.request('http://localhost:3000/api/v1/profile')
          .get('/me')
          .set({authorization: "failtoban"})
          .send({firstname: "testeur"})
          .end((err, res) => {
            res.should.have.status(401);
            done();
          });
      });
    });
});

}