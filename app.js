const express = require('express');
const app = express();
const userRouter = require('./routes/user.router');


const port = process.env.PORT || 3000;

app.use('/users', userRouter);

// Handle other endpoints or invalid requests
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});