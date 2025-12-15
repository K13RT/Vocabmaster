const jwt = require('jsonwebtoken');

const isProduction = process.env.NODE_ENV === 'production';

const JWT_SECRET = process.env.JWT_SECRET;
const REFRESH_SECRET = process.env.REFRESH_SECRET;

if (isProduction) {
  if (!JWT_SECRET) throw new Error('JWT_SECRET is required in production');
  if (!REFRESH_SECRET) throw new Error('REFRESH_SECRET is required in production');
}

// Fallbacks for development only
const FINAL_JWT_SECRET = JWT_SECRET || 'vocabulary-app-secret-key-2024';
const FINAL_REFRESH_SECRET = REFRESH_SECRET || `${FINAL_JWT_SECRET}-refresh`;

const ACCESS_TOKEN_TTL = process.env.ACCESS_TOKEN_TTL || '15m'; // e.g. '15m', '30m'
const REFRESH_TOKEN_TTL = process.env.REFRESH_TOKEN_TTL || '30d'; // used for signing
const REFRESH_COOKIE_MAX_AGE = parseInt(process.env.REFRESH_COOKIE_MAX_AGE_MS || `${30 * 24 * 60 * 60 * 1000}`, 10); // ms

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }
  
  jwt.verify(token, FINAL_JWT_SECRET, (err, user) => {
    if (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Token expired', code: 'token_expired' });
      }
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
}

function requireAdmin(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

function generateToken(user) {
  return jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    FINAL_JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_TTL }
  );
}

function generateRefreshToken(user) {
  return jwt.sign(
    { id: user.id, username: user.username, role: user.role, tokenType: 'refresh' },
    FINAL_REFRESH_SECRET,
    { expiresIn: REFRESH_TOKEN_TTL }
  );
}

function setRefreshCookie(res, refreshToken) {
  const secure = process.env.COOKIE_SECURE === 'true' || process.env.NODE_ENV === 'production';
  // Cross-site (Netlify -> Render) requires SameSite=None and Secure=true
  const sameSite = process.env.COOKIE_SAMESITE || (process.env.NODE_ENV === 'production' ? 'none' : 'strict');
  res.cookie('refresh_token', refreshToken, {
    httpOnly: true,
    secure,
    sameSite,
    path: '/api/auth',
    maxAge: REFRESH_COOKIE_MAX_AGE
  });
}

function clearRefreshCookie(res) {
  res.clearCookie('refresh_token', { path: '/api/auth' });
}

module.exports = { authenticateToken, requireAdmin, generateToken, generateRefreshToken, setRefreshCookie, clearRefreshCookie, JWT_SECRET: FINAL_JWT_SECRET, REFRESH_SECRET: FINAL_REFRESH_SECRET, ACCESS_TOKEN_TTL };
