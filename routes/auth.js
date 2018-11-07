'use strict'; 

const express = require('express'); 
const router = express.Router(); 
const passport = require('passport'); 
const jsonwebtoken = require('jsonwebtoken'); 

const {JWT_SECRET, JWT_EXPIRY} = require('../config.js'); 

const options = {session: false, failWithError: true }; 

const localAuth = passport.authenticate('local', options); 
const jwtAuth = passport.authenticate('jwt', {session:false, failWithError:true});

router.post('/refresh', jwtAuth, (req, res) => {
  const authToken = createAuthToken(req.user);
  res.json({ authToken }); 
});


router.post('/', localAuth, function(req, res){
  const authToken = createAuthToken(req.user); 
  res.json({authToken});
});

function createAuthToken (user) {
  return jsonwebtoken.sign({user}, JWT_SECRET, {
    subject: user.username,
    expiresIn: JWT_EXPIRY
  });
}


module.exports = router; 