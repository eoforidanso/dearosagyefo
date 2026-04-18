const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;

// Refuse to start without a real secret
if (!JWT_SECRET) {
  throw new Error('[AUTH] JWT_SECRET environment variable is not set. Add it to your .env file.');
}
if (JWT_SECRET.length < 32) {
  throw new Error('[AUTH] JWT_SECRET is too short. Use a random string of at least 32 characters.');
}

const JWT_ALGORITHM = 'HS256';

// Middleware to verify JWT token
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  // Pin algorithm to prevent algorithm-confusion attacks (e.g. alg:none)
  jwt.verify(token, JWT_SECRET, { algorithms: [JWT_ALGORITHM] }, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
}

// Generate JWT token
function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email },
    JWT_SECRET,
    { expiresIn: '7d', algorithm: JWT_ALGORITHM }
  );
}

module.exports = {
  authenticateToken,
  generateToken
};
