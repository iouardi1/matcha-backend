const express = require('express');
const router = express.Router();
// const AuthController = require('../controllers/auth.controller');
const passport = require('passport');

router.get('/google',
  passport.authenticate('google', { scope: [ 'email', 'profile' ]
}));
router.get('/google/callback', passport.authenticate( 'google', {
   successRedirect: '/profile',
   failureRedirect: '/login'
}));
// Add more routes for the /users endpoint as needed

module.exports = router;