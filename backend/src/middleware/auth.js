const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  const token = req.header('Authorization');

  if (!token) {
    return res.status(401).json({ success: false, error: 'No token, authorization denied' });
  }

  try {
    const bearer = token.split(' ')[1] || token;
    const decoded = jwt.verify(bearer, process.env.JWT_SECRET || 'b2b_secret_key');
    req.user = decoded.user;
    next();
  } catch (err) {
    res.status(401).json({ success: false, error: 'Token is not valid' });
  }
};
