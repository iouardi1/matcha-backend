// const express = require('express');
// const session = require('express-session');
// const app = express();
// const userRouter = require('./routes/user.router');
// const authRouter = require('./routes/auth.router');
// const passport = require('passport');

// const port = process.env.PORT || 3005;


// require('./strategies/googleStrategy')
// app.use(passport.initialize());
// app.use(passport.session());

// app.use('/users', userRouter);
// app.use('/auth', authRouter);

// app.use(session({
//   secret: 'secret-key',
//   resave: false,
//   saveUninitialized: false
// }));

// app.get('/profile', (req, res) => {
//   if (!req.isAuthenticated()) {
//     return res.redirect('/');
//   }
//   res.send(`Hello ${req.user.displayName}`);
// });

// app.get('/logout', (req, res) => {
//   req.logout((err) => {
//     if (err) { return next(err); }
//     res.redirect('/');
//   });
// });


// // Handle other endpoints or invalid requests
// app.use((req, res) => {
//   res.status(404).json({ error: 'Endpoint not found' });
// });

// app.listen(port, () => {
//   console.log(`Server listening on port ${port}`);
// });
// app.js

const express = require('express');
const passport = require('passport');
const session = require('express-session');
require('./strategies/googleStrategy'); // Require the external file
const userRouter = require('./routes/user.router');
const authRouter = require('./routes/auth.router');

const app = express();

app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());


app.use('/users', userRouter);
app.use('/auth', authRouter);

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

app.listen(3005, () => {
  console.log('Server is running');
});
