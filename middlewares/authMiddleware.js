const jwt = require('jsonwebtoken');
const SECRET_KEY = process.env.JWT_SECRET;

const authenticateToken = (req, res, next) => {
  const token = req.headers['authorization'];

  if (!token) return res.status(403).json({ error: 'A token is required for authentication' });

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    req.user = decoded;
  } catch (err) {
    return res.status(401).json({ error: 'Invalid Token' });
  }
  return next();
};

module.exports = authenticateToken;
