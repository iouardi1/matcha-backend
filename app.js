require('dotenv').config();
const express = require('express');
var cors = require('cors')
const app = express();

app.use(cors({
  origin: 'http://localhost:3001', // Your Next.js frontend URL
  credentials: true // Allow credentials (cookies) to be sent
}));

app.use(express.json());

const authRoutes = require('./routes/auth.router');
app.use('/api/auth', authRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
})
const passport = require('passport');
const session = require('express-session');
require('./strategies/googleStrategy'); // Require the external file
const userRouter = require('./routes/user.router');


app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());


app.use('/users', userRouter);


app.get('/profile', (req, res) => {
  if (!req.isAuthenticated()) {
    return res.redirect('/');
  }
  res.send(`Hello ${req.user.displayName}`);
});

app.get('/logout', (req, res) => {
  req.logout((err) => {
    if (err) { return next(err); }
    res.redirect('/');
  });
});
