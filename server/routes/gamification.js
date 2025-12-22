const express = require('express');
const router = express.Router();
const gamificationRepository = require('../repositories/sqlite/GamificationRepository');
const { authenticateToken } = require('../middleware/auth');

// Get current streak
router.get('/streak', authenticateToken, async (req, res) => {
  try {
    const streak = await gamificationRepository.getStreak(req.user.id);
    res.json(streak);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get user stats
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const stats = await gamificationRepository.getStats(req.user.id);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all achievements
router.get('/achievements', authenticateToken, async (req, res) => {
  try {
    const achievements = await gamificationRepository.getAchievements();
    const userAchievements = await gamificationRepository.getUserAchievements(req.user.id);
    
    // Mark unlocked achievements
    const unlockedIds = new Set(userAchievements.map(ua => ua.id));
    const result = achievements.map(a => ({
      ...a,
      unlocked: unlockedIds.has(a.id),
      unlocked_at: userAchievements.find(ua => ua.id === a.id)?.unlocked_at || null
    }));
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get leaderboard
router.get('/leaderboard', authenticateToken, async (req, res) => {
  try {
    const { type } = req.query;
    const leaderboard = await gamificationRepository.getLeaderboard(type, req.user.id);
    res.json(leaderboard);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get daily challenges
router.get('/challenges/today', authenticateToken, async (req, res) => {
  try {
    const challenges = await gamificationRepository.getDailyChallenges(req.user.id);
    res.json(challenges);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
