const jwt = require('jsonwebtoken');
const { User } = require('../models/userModel');
const bcrypt = require('bcrypt');
const SECRET_KEY = process.env.JWT_SECRET;

const registerUser = async (req, res) => {
  const { firstname, lastname, email, password } = req.body;

  if (!firstname || !lastname || !email || !password) {
    console.log(firstname + ' ' + lastname + ' ' + email + ' ' + password);
    return res.status(400).json({ error: 'All fields are required' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    const newUser = await User.create({
      firstname,
      lastname,
      email,
      password: hashedPassword,
    });
    res.status(201).json({ message: 'User registered successfully', newUser });
  } catch (error) {
    console.log(error)
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

const loginUser = async (req, res) => {
    const { email, password } = req.body;
  
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
  
    try {
      const user = await User.findByEmail(email);
  
      if (!user) {
        return res.status(400).json({ error: 'Invalid credentials' });
      }
  
      const isMatch = await bcrypt.compare(password, user.password);
  
      if (!isMatch) {
        return res.status(400).json({ error: 'Invalid credentials' });
      }
  
      const token = jwt.sign({ id: user.id }, SECRET_KEY, { expiresIn: '1h' });
  
      res.json({ message: 'Logged in successfully', token });
    } catch (error) {
      res.status(500).json({ error: 'Internal Server Error' });
    }
  };

module.exports = { registerUser, loginUser };