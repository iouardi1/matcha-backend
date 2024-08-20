//requirements
require("dotenv").config();
require("./strategies/googleStrategy");
const express = require("express");

const PORT = process.env.PORT || 3000;
const passport = require("passport");
const session = require("express-session");
//routes
const userRouter = require("./routes/user.router");
const authRoutes = require("./routes/auth.router");
const profileRoutes = require("./routes/profile.router");
const uploadRoutes = require("./routes/upload.router");
const chatRouters = require("./routes/chat.router");

//middlewares
const verifyTokenMiddleware = require("./middlewares/extractToken");
const verifyAccountMiddleware = require("./middlewares/verifiedAccountMiddleware");

var cors = require("cors");
const app = express();

app.use(
	cors({
		origin: "http://localhost:3000",
		credentials: true,
	}),
);

app.use(express.json());
app.use(
	session({
		secret: "secret",
		resave: false,
		saveUninitialized: false,
	}),
);

app.use(passport.initialize());
app.use(passport.session());
app.use(express.urlencoded({ extended: true }));

app.use("/api/auth", authRoutes);
app.use("/api/users", userRouter);
app.use("/api/profile", verifyTokenMiddleware, verifyAccountMiddleware, profileRoutes);
app.use("/api/upload", uploadRoutes);
app.use('/api/conversations', chatRouters);

app.get("/logout", (req, res) => {
	req.logout((err) => {
		if (err) {
			return next(err);
		}
		res.redirect("/");
	});
});

app.listen(PORT, () => {
	console.log(`Server is running on port ${PORT}`);
});
