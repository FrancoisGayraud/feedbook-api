//During the test the env variable is set to test
//process.env.NODE_ENV = 'test';

//Require the dev-dependencies
let chai = require('chai');
let chaiHttp = require('chai-http');
let server = require('../app');
let should = chai.should();
let expect = require('chai').expect;

//server.listen(3000);

chai.use(chaiHttp);
//Our parent block

//Utilisateur déja crée dans la bdd mail': 'feedbook@gmail.com', password: 'abcd'

////////////////////////////////////////////// 

//TODO LOGIN AVEC NON D'utilisateur

describe('AUTH', () => {
  describe('/POST login', () => {
    it('Login a valid user', (done) => {
      chai.request('http://localhost:3000/api/v1')
        .post('/login')
        .send({'mail': 'test@api.com', password: 'abcd'})
        .end((err, res) => {
          res.should.have.status(200);
          done();
        });
    });
  });



  //Wrong password
  describe('/POST login', () => {
    it('Login a wrong password', (done) => {
      chai.request('http://localhost:3000/api/v1')
        .post('/login')
        .send({'mail': 'feedbook@gmail.com', password: 'abcda'})
        .end((err, res) => {
          res.should.have.status(403);
          done();
        });
    });
  });

  //Wrong mail
  describe('/POST login', () => {
    it('Login a wrong mail', (done) => {
      chai.request('http://localhost:3000/api/v1')
        .post('/login')
        .send({'mail': 'feedboaok@gmail.com', password: 'abcd'})
        .end((err, res) => {
          res.should.have.status(403);
          done();
        });
    });
  });

//////////////////////////////////////////////

//Register à finir
describe('/POST register', () => {
    it('register a valid user', (done) => {
      chai.request('http://localhost:3000/api/v1')
        .post('/register')
        .send({pseudo:'toto', 'mail': 'ttot@daldald', password: 'adlal'})
        .end((err, res) => {
          res.should.have.status(409)
          done();
        })
    })
  })

//Mail in use can't register
describe('/POST register', () => {
    it('register a user with a mail in use', (done) => {
      chai.request('http://localhost:3000/api/v1')
        .post('/register')
        .send({pseudo:'feedbook', 'mail': 'feedbook@gmail.com', password: 'adlal'})
        .end((err, res) => {
          res.should.have.status(409)
          done();
        })
    })
  })
});

