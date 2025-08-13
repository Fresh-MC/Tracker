// middleware/auth.js
const jwt = require("jsonwebtoken");

const SECRET = "your_jwt_secret"; // use env var in production

module.exports = function (req, res, next) {
  const token = req.cookies.token; // JWT stored in cookie
  if (!token) return res.status(401).json({ error: "Unauthorized - No token" });

  try {
    const decoded = jwt.verify(token, SECRET);
    req.user = decoded; // now available in routes
    next();
  } catch (err) {
    return res.status(403).json({ error: "Invalid token" });
  }
};
