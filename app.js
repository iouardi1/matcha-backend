//requirements
require('dotenv').config();
require('./strategies/googleStrategy');
const express = require('express');

const PORT = process.env.PORT || 3000;
const passport = require('passport');
const session = require('express-session');
//routes
const userRouter = require('./routes/user.router');
const authRoutes = require('./routes/auth.router');
const profileRoutes = require('./routes/profile.router');


var cors = require('cors')
const app = express();

app.use(cors({
  origin: 'http://localhost:3000', // Your Next.js frontend URL
  credentials: true // Allow credentials (cookies) to be sent
}));
app.use(express.json());
app.use(session({
  secret: 'secret',
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

app.use('/api/auth', authRoutes);
app.use('/users', userRouter);
app.use('/profile', profileRoutes);

app.get('/logout', (req, res) => {
  req.logout((err) => {
    if (err) { return next(err); }
    res.redirect('/');
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
})