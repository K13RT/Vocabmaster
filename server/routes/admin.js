const express = require('express');
const { UserRepository, AdminRepository } = require('../repositories');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// All admin routes require authentication and admin role
router.use(authenticateToken, requireAdmin);

// Get all users
router.get('/users', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const search = req.query.search || '';
    const result = await UserRepository.getAll(page, 20, search);
    res.json(result);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to get users' });
  }
});

// Get user details
router.get('/users/:id', async (req, res) => {
  try {
    const data = await AdminRepository.getUserDetailedStats(req.params.id);
    if (!data.user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(data);
  } catch (error) {
    console.error('Get user details error:', error);
    res.status(500).json({ error: 'Failed to get user details' });
  }
});

// Get user's sets (Admin view)
router.get('/users/:id/sets', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const { SetRepository } = require('../repositories');
    const result = await SetRepository.getByUserId(req.params.id, page);
    res.json(result);
  } catch (error) {
    console.error('Get user sets error:', error);
    res.status(500).json({ error: 'Failed to get user sets' });
  }
});

// Create set for user
router.post('/users/:id/sets', async (req, res) => {
  try {
    const { name, topic, description, is_public, words } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Set name is required' });
    }
    
    const { SetRepository, WordRepository } = require('../repositories');
    const set = await SetRepository.create(req.params.id, name, topic, description, is_public);
    
    // Add words if provided
    if (words && Array.isArray(words) && words.length > 0) {
      for (const word of words) {
        if (word.word && word.meaning) {
          await WordRepository.create(set.id, word.word, word.meaning, word.example, word.phonetic);
        }
      }
    }
    
    res.status(201).json({ set });
  } catch (error) {
    console.error('Create user set error:', error);
    res.status(500).json({ error: 'Failed to create set for user' });
  }
});

// Update user (activate/deactivate, change role)
router.put('/users/:id', async (req, res) => {
  try {
    const { is_active, role } = req.body;
    const updateData = {};
    
    if (is_active !== undefined) updateData.is_active = is_active;
    if (role !== undefined) updateData.role = role;
    
    const user = await UserRepository.update(req.params.id, updateData);
    res.json({ user });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Overview stats
router.get('/stats/overview', async (req, res) => {
  try {
    const stats = await AdminRepository.getOverviewStats();
    res.json({ stats });
  } catch (error) {
    console.error('Get overview stats error:', error);
    res.status(500).json({ error: 'Failed to get overview stats' });
  }
});

// Weekly stats
router.get('/stats/weekly', async (req, res) => {
  try {
    const data = await AdminRepository.getWeeklyStats();
    res.json({ data });
  } catch (error) {
    console.error('Get weekly stats error:', error);
    res.status(500).json({ error: 'Failed to get weekly stats' });
  }
});

// Monthly stats
router.get('/stats/monthly', async (req, res) => {
  try {
    const data = await AdminRepository.getMonthlyStats();
    res.json({ data });
  } catch (error) {
    console.error('Get monthly stats error:', error);
    res.status(500).json({ error: 'Failed to get monthly stats' });
  }
});

// Yearly stats
router.get('/stats/yearly', async (req, res) => {
  try {
    const data = await AdminRepository.getYearlyStats();
    res.json({ data });
  } catch (error) {
    console.error('Get yearly stats error:', error);
    res.status(500).json({ error: 'Failed to get yearly stats' });
  }
});

// Top users
router.get('/stats/top-users', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const users = await AdminRepository.getTopUsers(limit);
    res.json({ users });
  } catch (error) {
    console.error('Get top users error:', error);
    res.status(500).json({ error: 'Failed to get top users' });
  }
});

// Hardest words
router.get('/stats/hardest-words', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const words = await AdminRepository.getHardestWords(limit);
    res.json({ words });
  } catch (error) {
    console.error('Get hardest words error:', error);
    res.status(500).json({ error: 'Failed to get hardest words' });
  }
});

module.exports = router;
