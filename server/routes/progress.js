const express = require('express');
const { ProgressRepository, WordRepository } = require('../repositories');
const { authenticateToken } = require('../middleware/auth');
const gamificationRepository = require('../repositories/sqlite/GamificationRepository');

const router = express.Router();

// Get user progress stats
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const stats = await ProgressRepository.getStats(req.user.id);
    const progress = await ProgressRepository.getByUserId(req.user.id);
    
    // Add gamification stats
    const gStats = await gamificationRepository.getStats(req.user.id);
    const streak = await gamificationRepository.getStreak(req.user.id);
    
    res.json({ stats, progress, gamification: { stats: gStats, streak } });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Failed to get progress stats' });
  }
});

// Get difficult words (remembered = 0)
router.get('/difficult', authenticateToken, async (req, res) => {
  try {
    const words = await ProgressRepository.getDifficultWords(req.user.id);
    res.json({ words });
  } catch (error) {
    console.error('Get difficult words error:', error);
    res.status(500).json({ error: 'Failed to get difficult words' });
  }
});

// Get due words for review
router.get('/due', authenticateToken, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const words = await ProgressRepository.getDueWords(req.user.id, limit);
    res.json({ words });
  } catch (error) {
    console.error('Get due words error:', error);
    res.status(500).json({ error: 'Failed to get due words' });
  }
});

// Get all learned words
router.get('/learned', authenticateToken, async (req, res) => {
  try {
    const words = await ProgressRepository.getLearnedWords(req.user.id);
    res.json({ words });
  } catch (error) {
    console.error('Get learned words error:', error);
    res.status(500).json({ error: 'Failed to get learned words' });
  }
});

// Get progress for all sets
router.get('/sets', authenticateToken, async (req, res) => {
  try {
    const progress = await ProgressRepository.getSetProgress(req.user.id);
    res.json({ progress });
  } catch (error) {
    console.error('Get set progress error:', error);
    res.status(500).json({ error: 'Failed to get set progress' });
  }
});

// Review a word (update progress with SM-2)
router.post('/review', authenticateToken, async (req, res) => {
  try {
    const { word_id, remembered, quality = 3 } = req.body;
    
    if (word_id === undefined || remembered === undefined) {
      return res.status(400).json({ error: 'word_id and remembered are required' });
    }
    
    // Verify word exists
    const word = await WordRepository.getById(word_id);
    if (!word) {
      return res.status(404).json({ error: 'Word not found' });
    }
    
    const progress = await ProgressRepository.upsert(req.user.id, word_id, remembered, quality);
    
    // Gamification updates
    await gamificationRepository.updateStreak(req.user.id);
    
    // Award XP and points for reviewing
    const xpAwarded = remembered ? 5 : 2;
    const pointsAwarded = remembered ? 1 : 0;
    await gamificationRepository.addXP(req.user.id, xpAwarded, pointsAwarded);
    
    // Update daily challenges
    if (remembered) {
      await gamificationRepository.updateChallengeProgress(req.user.id, 'daily_goal', 1);
    }

    // Check for achievements
    const totalLearned = await ProgressRepository.getLearnedWordsCount(req.user.id);
    if (totalLearned >= 1) await gamificationRepository.checkAndUnlockAchievement(req.user.id, 'first_word');
    if (totalLearned >= 10) await gamificationRepository.checkAndUnlockAchievement(req.user.id, 'getting_started');
    if (totalLearned >= 50) await gamificationRepository.checkAndUnlockAchievement(req.user.id, 'on_the_way');
    if (totalLearned >= 100) await gamificationRepository.checkAndUnlockAchievement(req.user.id, 'word_collector');

    res.json({ 
      progress,
      rewards: {
        xp: xpAwarded,
        points: pointsAwarded
      }
    });
  } catch (error) {
    console.error('Review error:', error);
    res.status(500).json({ error: 'Failed to update progress' });
  }
});

// Toggle favorite status
router.post('/favorite', authenticateToken, async (req, res) => {
  try {
    const { word_id } = req.body;
    
    if (word_id === undefined) {
      return res.status(400).json({ error: 'word_id is required' });
    }
    
    const result = await ProgressRepository.toggleFavorite(req.user.id, word_id);
    res.json(result);
  } catch (error) {
    console.error('Toggle favorite error:', error);
    res.status(500).json({ error: 'Failed to toggle favorite' });
  }
});

// Reset progress for a word
router.delete('/reset/:wordId', authenticateToken, async (req, res) => {
  try {
    await ProgressRepository.resetProgress(req.user.id, req.params.wordId);
    res.json({ message: 'Progress reset successfully' });
  } catch (error) {
    console.error('Reset progress error:', error);
    res.status(500).json({ error: 'Failed to reset progress' });
  }
});

module.exports = router;
