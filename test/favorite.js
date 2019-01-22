//Require the dev-dependencies
let chai = require('chai');
let chaiHttp = require('chai-http');
let server = require('../app');
let should = chai.should();
let expect = require('chai').expect;


chai.use(chaiHttp);
//Our parent block
module.exports = function (user_token){

    //get favorite wih valid token
    describe('FAVORITE', () => {
        describe('/GET favorite', () => {
          it('get favorite wih valid token', (done) => {
            chai.request('http://localhost:3000/api/v1/Favorites')
              .get('/me')
              .set({authorization: user_token})
              .end((err, res) => {
                res.should.have.status(200);
                done();
              });
          });
        });
    });

    //get favorite wih INVALID token
    describe('FAVORITE', () => {
        describe('/GET favorite', () => {
          it('get favorite wih INVALID token', (done) => {
            chai.request('http://localhost:3000/api/v1/Favorites')
              .get('/me')
              .set({authorization: "taltaltl"})
              .end((err, res) => {
                res.should.have.status(401);
                done();
              });
          });
        });
    });

    //add favorite wih valid token
    describe('FAVORITE', () => {
        describe('/post favorite', () => {
          it('add favorite wih valid token', (done) => {
            chai.request('http://localhost:3000/api/v1/Favorites')
              .post('/me')
              .set({authorization: user_token})
              .send({type: "Action", title:"Les Tests de l'API"})
              .end((err, res) => {
                res.should.have.status(200);
                done();
              });
          });
        });
    });

    //add favorite wih invalid token
    describe('FAVORITE', () => {
        describe('/post favorite', () => {
          it('add favorite wih invalid token', (done) => {
            chai.request('http://localhost:3000/api/v1/Favorites')
              .post('/me')
              .set({authorization: "ddadad"})
              .send({type: "Action", title:"Les Tests de l'API"})
              .end((err, res) => {
                res.should.have.status(401);
                done();
              });
          });
        });
    });


}