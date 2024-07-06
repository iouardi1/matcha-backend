const express = require('express');
const router = express.Router();
const UserController = require('../controllers/user.conroller');

// Handle the /users endpoint
router.get('/', UserController.getAllUsers);

// Add more routes for the /users endpoint as needed

module.exports = router;