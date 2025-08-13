// middleware/verify.js
const jwt = require('jsonwebtoken');

const getToken = (req) => {
  const cookieName = process.env.COOKIE_NAME || 'token';
  const fromCookie = req.cookies?.[cookieName];
  const fromHeader = req.headers.authorization?.startsWith('Bearer ')
    ? req.headers.authorization.split(' ')[1]
    : null;
  return fromCookie || fromHeader || null;
};

exports.verifyToken = (req, res, next) => {
  const token = getToken(req);
  if (!token) return res.status(401).json({ message: 'No token provided' });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload; // { id, email, role }
    next();
  } catch (e) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

exports.requireRole = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ message: 'Forbidden' });
  }
  next();
};
