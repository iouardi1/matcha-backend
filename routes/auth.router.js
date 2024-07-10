const express = require('express');
const  passport = require('passport');
const router = express.Router();
const { registerUser, loginUser } = require('../controllers/authController');

// Register route
router.post('/register', registerUser);

// Login route
router.post('/login', loginUser);

router.get('/google',
  passport.authenticate('google', { scope: [ 'email', 'profile' ]
}));
router.get('/google/callback', passport.authenticate( 'google', {
   successRedirect: '/profile',
   failureRedirect: '/login'
}));

module.exports = router;