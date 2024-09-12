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
const { createServer } = require("http");
const { Server } = require("socket.io");

//middlewares
const verifyTokenMiddleware = require("./middlewares/extractToken");
const verifyAccountMiddleware = require("./middlewares/verifiedAccountMiddleware");

var cors = require("cors");
const { constrainedMemory } = require("process");
const ChatController = require("./controllers/chatController");
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: `${process.env.CLIENT_URL}`
  }
});


io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Handle joining a conversation room
  socket.on("join conversation", (conversationId) => {
    socket.join(`room${conversationId}`);
    console.log(`User ${socket.id} joined conversation ${conversationId}`);
  });

  // Handle leaving a conversation room
  socket.on("leave conversation", (conversationId) => {
    socket.leave(conversationId);
    console.log(`User ${socket.id} left conversation ${conversationId}`);
  });

  // Handle receiving a new message
  socket.on("new message", (messageData) => {
    const { conversationId, message_text, participant_id } = messageData;
     ChatController.addNewMessage(messageData)
      .then(() => {
        console.log(`Message saved in the database.`);
      })
      .catch((err) => {
        console.error(`Error saving message: ${err}`);
      });

    // Save the message to the database (optional, if using a DB)
    // saveMessageToDatabase(conversationId, senderId, messageText);

    // Emit the message to all users in the conversation room
    io.to(`room${conversationId}`).emit("message received", {
      participant_id,
      conversationId,
      message_text,
      timestamp: new Date(),
    });

    console.log(`New message in conversation ${conversationId}: ${message_text}`);
  });

  // Handle user disconnection
  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});


app.use(
	cors({
		origin: `${process.env.CLIENT_URL}`,
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

// app.listen(PORT, () => {
// 	console.log(`Server is running on port ${PORT}`);
// });
httpServer.listen(process.env.PORT);

