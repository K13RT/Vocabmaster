const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { UserRepository } = require('../repositories');
const { generateToken, generateRefreshToken, authenticateToken, REFRESH_SECRET, setRefreshCookie, clearRefreshCookie, ACCESS_TOKEN_TTL } = require('../middleware/auth');

const router = express.Router();

// Register
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email and password are required' });
    }
    
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }
    
    const existingUser = await UserRepository.getByUsername(username);
    if (existingUser) {
      return res.status(400).json({ error: 'Username already exists' });
    }
    
    const existingEmail = await UserRepository.getByEmail(email);
    if (existingEmail) {
      return res.status(400).json({ error: 'Email already registered' });
    }
    
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await UserRepository.create(username, email, passwordHash);
    
    const token = generateToken(user);
    const refreshToken = generateRefreshToken(user);
    setRefreshCookie(res, refreshToken);
    
    res.status(201).json({
      message: 'Registration successful',
      user: { id: user.id, username: user.username, email: user.email, role: user.role },
      token,
      expiresIn: parseInt(process.env.ACCESS_TOKEN_EXPIRES_SEC || '900', 10)
    });
  } catch (error) {
    console.error('Registration error:', error);
    // Log detailed error for debugging
    if (error.message) console.error('Error message:', error.message);
    if (error.details) console.error('Error details:', error.details);
    if (error.hint) console.error('Error hint:', error.hint);
    res.status(500).json({ error: 'Registration failed', details: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }
    
    let user = await UserRepository.getByUsername(username);
    if (!user) {
      user = await UserRepository.getByEmail(username);
    }
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // is_active could be 1, 0, true, false, or undefined
    if (user.is_active === 0 || user.is_active === false) {
      return res.status(403).json({ error: 'Account is disabled' });
    }
    
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const token = generateToken(user);
    const refreshToken = generateRefreshToken(user);
    setRefreshCookie(res, refreshToken);
    
    res.json({
      message: 'Login successful',
      user: { id: user.id, username: user.username, email: user.email, role: user.role },
      token,
      expiresIn: parseInt(process.env.ACCESS_TOKEN_EXPIRES_SEC || '900', 10)
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Logout - clear refresh cookie
router.post('/logout', (req, res) => {
  clearRefreshCookie(res);
  res.json({ message: 'Logged out' });
});

// Get current user
router.get('/me', authenticateToken, async (req, res) => {
  const user = await UserRepository.getById(req.user.id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  // Also fetch sensitive settings if needed (like AI API key)
  const fullUser = await UserRepository.getByUsername(user.username);
  res.json({ 
    user: {
      ...user,
      ai_api_key: fullUser.ai_api_key ? '********' + fullUser.ai_api_key.slice(-4) : null
    } 
  });
});

// Update settings (AI API key)
router.put('/settings', authenticateToken, async (req, res) => {
  try {
    const { ai_api_key } = req.body;
    
    const updateData = {};
    if (ai_api_key !== undefined) updateData.ai_api_key = ai_api_key;
    
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: 'No settings to update' });
    }
    
    await UserRepository.update(req.user.id, updateData);
    res.json({ message: 'Settings updated successfully' });
  } catch (error) {
    console.error('Settings update error:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// Refresh access token
router.post('/refresh', async (req, res) => {
  try {
    const refreshToken = req.cookies?.refresh_token;
    if (!refreshToken) {
      return res.status(401).json({ error: 'Refresh token required' });
    }
    
    let payload;
    try {
      payload = jwt.verify(refreshToken, REFRESH_SECRET);
    } catch (err) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }
    
    const user = await UserRepository.getById(payload.id);
    if (!user || user.is_active === 0 || user.is_active === false) {
      return res.status(401).json({ error: 'User is not active' });
    }
    
    const newAccessToken = generateToken(user);
    const newRefreshToken = generateRefreshToken(user);
    setRefreshCookie(res, newRefreshToken);
    
    res.json({
      token: newAccessToken,
      expiresIn: parseInt(process.env.ACCESS_TOKEN_EXPIRES_SEC || '900', 10)
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({ error: 'Failed to refresh token' });
  }
});

// Update password
router.put('/password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new password are required' });
    }
    
    const user = await UserRepository.getByUsername(req.user.username);
    const validPassword = await bcrypt.compare(currentPassword, user.password_hash);
    
    if (!validPassword) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }
    
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await UserRepository.update(req.user.id, { password_hash: passwordHash });
    
    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Password update error:', error);
    res.status(500).json({ error: 'Failed to update password' });
  }
});

module.exports = router;
