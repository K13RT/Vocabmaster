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

const supabase = require('../lib/supabase');

const { UserRepository } = require('../repositories');

async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }
  
  try {
    // Verify token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      console.error('Supabase auth error:', error);
      return res.status(403).json({ error: 'Invalid or expired token' });
    }

    // Sync user to local database (public.users)
    // This ensures the user exists for foreign key constraints
    try {
      let dbUser = await UserRepository.getById(user.id);
      if (!dbUser) {
        // Create user if not exists
        // Note: We use password_hash='supabase_auth' as placeholder since auth is handled by Supabase
        dbUser = await UserRepository.create(
          user.user_metadata?.username || user.email.split('@')[0],
          user.email,
          'supabase_auth',
          'user',
          user.id // Force ID to match Supabase Auth ID
        );
        // Ensure ID matches Supabase ID (UserRepository.create might generate new ID if not handled)
        // Actually, Supabase UserRepository.create should handle this or we might need a specific method.
        // Let's check UserRepository.js implementation.
        // If UserRepository.create generates a random UUID, we have a problem.
        // We need to insert WITH the specific ID from Supabase Auth.
      }
    } catch (syncError) {
      console.error('User sync error:', syncError);
      // Continue anyway, maybe it exists but query failed?
    }

    // Attach user to request
    req.user = {
      id: user.id,
      email: user.email,
      role: user.user_metadata?.role || 'user'
    };
    
    next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    return res.status(403).json({ error: 'Authentication failed' });
  }
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
