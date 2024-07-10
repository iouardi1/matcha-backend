const express = require('express');
const router = express.Router();
const { registerUser, loginUser } = require('../controllers/authController');
const UserController = require('../controllers/user.contoller');

router.post('/register', registerUser);
router.post('/login', loginUser);

// Add more routes for the /users endpoint as needed

module.exports = router;