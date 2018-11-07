'use strict';

const app = require('../server');
const chai = require('chai');
const chaiHttp = require('chai-http');
const mongoose = require('mongoose');

const { TEST_MONGODB_URI } = require('../config');

const User = require('../models/user');

const expect = chai.expect;

chai.use(chaiHttp);

describe('Noteful API - Users', function () {
  const username = 'exampleUser';
  const password = 'examplePass';
  const fullname = 'Example User';

  before(function () {
    return mongoose.connect(TEST_MONGODB_URI, { useNewUrlParser: true, useCreateIndex: true})
      .then(() => User.createIndexes());
  });

  beforeEach(function () {
  });
  
  afterEach(function () {
    return User.deleteMany();
  });

  after(function () {
    return mongoose.connection.db.dropDatabase()
      .then(() => mongoose.disconnect());
  });

  describe('POST /api/users', function () {
    it('Should create a new user', function () {
      const testUser = { username, password, fullname };

      let res;
      return chai
        .request(app)
        .post('/api/users')
        .send(testUser)
        .then(_res => {
          res = _res;
          expect(res).to.have.status(201);
          expect(res.body).to.be.an('object');
          expect(res.body).to.have.keys('id', 'username', 'fullname');

          expect(res.body.id).to.exist;
          expect(res.body.username).to.equal(testUser.username);
          expect(res.body.fullname).to.equal(testUser.fullname);

          return User.findOne({ username });
        })
        .then(user => {
          expect(user).to.exist;
          expect(user.id).to.equal(res.body.id);
          expect(user.fullname).to.equal(testUser.fullname);
          return user.validatePassword(password);
        })
        .then(isValid => {
          expect(isValid).to.be.true;
        });
    });
    it('Should reject users with missing username', function () {
      const testUser = { password , fullname };
      return chai.request(app)
        .post('/api/users')
        .send(testUser)
        .catch(err => err.response)
        .then(res => {
          expect(res).to.have.status(422);
          expect(res.body.message).to.equal('Missing \'username\' in request body');
        });
    });
    it('Should reject users with missing password', function(){
      const testUser = { username, fullname};
      return chai.request(app)
        .post('/api/users')
        .send(testUser)
        .catch(err => err.response)
        .then(res => {
          expect(res).to.have.status(422); 
          expect(res.body.message).to.equal('Missing \'password\' in request body');
        });
    });
    it('Should reject users with non-string username', function(){
      return chai
        .request(app)
        .post('/api/users')
        .send({
          fullname,
          username: 1234,
          password
        })
        .catch(err => err.response)
        .then(res => {
          expect(res).to.have.status(422);
          expect(res.body.message).to.equal('Field: \'username\' must be type String');
        });
    });
   
    it('Should reject users with non-string password', function(){
      return chai
        .request(app)
        .post('/api/users')
        .send({
          fullname,
          username,
          password: 12345678
        })
        .catch(err => err.response)
        .then(res => {
          expect(res).to.have.status(422);
          expect(res.body.message).to.equal('Field: \'password\' must be type String');
        });
    });
  
    it('Should reject users with non-trimmed username', function(){
      return chai
        .request(app)
        .post('/api/users')
        .send({
          fullname,
          username: ` ${username} `,
          password
        })
        .catch(err => err.response)
        .then(res => {
          expect(res).to.have.status(422); 
          expect(res.body.message).to.equal('Field: \'username\' cannot start or end with whitespace');
        });
    });
  
    it('Should reject users with non-trimmed password', function(){
      return chai
        .request(app)
        .post('/api/users')
        .send({
          fullname,
          password: ` ${password} `,
          username
        })
        .catch(err => err.response)
        .then(res => {
          expect(res).to.have.status(422); 
          expect(res.body.message).to.equal('Field: \'password\' cannot start or end with whitespace');
        });
    });  
    it('Should reject users with empty username', function () {
      return chai
        .request(app)
        .post('/api/users')
        .send({
          username: '',
          password,
          fullname
        })
        .catch(err => err.response)
        .then(res => {
          expect(res).to.have.status(422);
          expect(res.body.message).to.equal('Field: \'username\' must be at least 1 characters long');
        });
    });
    it('Should reject users with password less than 8 characters', function(){
      return chai
        .request(app)
        .post('/api/users')
        .send({
          username,
          password: '1234567'
        })
        .catch(err => err.response)
        .then(res => {
          expect(res).to.have.status(422); 
          expect(res.body.message).to.equal('Field: \'password\' must be at least 8 characters long');
        });
    }); 
    it('Should reject users with password greater than 72 characters', function(){
      return chai
        .request(app)
        .post('/api/users')
        .send({
          username,
          password: new Array(73).fill('a').join(''),
          fullname
        })
        .catch(err => err.response)
        .then(res => {
          expect(res).to.have.status(422);
          expect(res.body.message).to.equal('Field: \'password\' must be at most 72 characters long');
        });
    });
    it('Should reject users with duplicate username', function(){
    //   // Create an initial user
      return User.create({
        username,
        password,
        fullname
      })
        .then(() =>
        // Try to create a second user with the same username
          chai.request(app).post('/api/users').send({
            username,
            password,
            fullname
          })
        )
        .catch(err => err.message)
        .then(res =>{
          expect(res).to.have.status(400); 
          expect(res.body.message).to.equal('The username already exists');
        }); 
    });
    it('Should trim fullname', function(){
      const testUser = {username, fullname:' whitespace ', password};
      return chai 
        .request(app)
        .post('/api/users')
        .send(testUser)
        .then(res => {
          expect(res).to.have.status(201);
          expect(res.body.fullname).to.eql('whitespace');
        });
    });
  });
});