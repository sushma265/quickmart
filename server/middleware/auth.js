const jwt = require('jsonwebtoken');

const secret = () => process.env.JWT_SECRET || 'dev-secret-change-me';

function signToken(userId) {
  return jwt.sign({ id: userId }, secret(), { expiresIn: '7d' });
}

function readToken(req) {
  const header = req.headers.authorization || '';
  return header.startsWith('Bearer ') ? header.slice(7) : null;
}

// Requires a valid token
function protect(req, res, next) {
  const token = readToken(req);
  if (!token) return res.status(401).json({ message: 'Please log in to continue' });
  try {
    req.user = { id: jwt.verify(token, secret()).id };
    next();
  } catch {
    res.status(401).json({ message: 'Session expired, please log in again' });
  }
}

// Attaches req.user if a valid token is present, but never blocks
function optionalAuth(req, res, next) {
  const token = readToken(req);
  if (token) {
    try {
      req.user = { id: jwt.verify(token, secret()).id };
    } catch {
      /* ignore invalid token */
    }
  }
  next();
}

module.exports = { signToken, protect, optionalAuth };
