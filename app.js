//requirements
require('dotenv').config()
require('./strategies/googleStrategy')
const express = require('express')

const PORT = process.env.PORT || 3000
const passport = require('passport')
const session = require('express-session')
//routes
const userRouter = require("./routes/user.router");
const authRoutes = require("./routes/auth.router");
const profileRoutes = require("./routes/profile.router");
const uploadRoutes = require("./routes/upload.router");
const chatRoutes = require("./routes/chat.router");
const filterRoutes = require("./routes/filter.router");
const locationRoutes = require("./routes/location.router");
const { createServer } = require("http");
const { Server } = require("socket.io");

//middlewares
const verifyTokenMiddleware = require('./middlewares/extractToken')
const verifyAccountMiddleware = require('./middlewares/verifiedAccountMiddleware')

var cors = require("cors");
const SocketRouter = require("./routes/socket.router");
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: `${process.env.CLIENT_URL}`
  }
});


app.use(
    cors({
        origin: `${process.env.CLIENT_URL}`,
        credentials: true,
    })
)

app.use(express.json())
app.use(
    session({
        secret: 'secret',
        resave: false,
        saveUninitialized: false,
    })
)

app.use(passport.initialize())
app.use(passport.session())
app.use(express.urlencoded({ extended: true }))

app.use("/api/auth", authRoutes);
app.use("/api/users", userRouter);
app.use("/api/profile", verifyTokenMiddleware, verifyAccountMiddleware, profileRoutes);
app.use("/api/upload", uploadRoutes);
app.use('/api/conversations', verifyTokenMiddleware, verifyAccountMiddleware, chatRoutes);
app.use('/api/filterMatches', verifyTokenMiddleware, verifyAccountMiddleware, filterRoutes);
app.use('/api/location', locationRoutes);
app.post('/api/logout', (req, res) => {
  res.clearCookie('accessToken')
  res.status(200).json({
      shouldRedirect: true,
      redirectTo: '/auth/login',
      message: 'Logout',
  })
})
SocketRouter(io);
app.get("/logout", (req, res) => {
	req.logout((err) => {
		if (err) {
			return next(err);
		}
		res.redirect("/");
	});
});

// app.listen(process.env.PORT, () => {
// 	console.log(`Server is running on port ${process.env.PORT}`);
// });
httpServer.listen(process.env.PORT)
