const extractToken = (req, res, next) => {

  const headerToken = req.headers.authorization?.split(' ')[1];

  if (headerToken) {
      req.session.data = headerToken;
  }

  console.log(req.session.data)
  next();
}

module.exports = extractToken;