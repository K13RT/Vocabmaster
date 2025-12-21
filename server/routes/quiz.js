const express = require('express');
const { WordRepository, SetRepository, QuizRepository } = require('../repositories');
const { authenticateToken } = require('../middleware/auth');
const gamificationRepository = require('../repositories/sqlite/GamificationRepository');

const router = express.Router();

// Generate multiple choice quiz
router.get('/multiple-choice/:setId', authenticateToken, async (req, res) => {
  try {
    const set = await SetRepository.getById(req.params.setId);
    
    if (!set) {
      return res.status(404).json({ error: 'Vocabulary set not found' });
    }
    
    if (set.user_id !== req.user.id && !set.is_public) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const allWords = await WordRepository.getBySetId(req.params.setId);
    
    if (allWords.length < 4) {
      return res.status(400).json({ error: 'Set needs at least 4 words for a quiz' });
    }
    
    // Get words from the set
    const words = await WordRepository.getBySetId(req.params.setId);
    
    if (words.length < 4) {
      return res.status(400).json({ 
        error: `Bộ từ này chỉ có ${words.length} từ. Bạn cần ít nhất 4 từ để làm quiz.`,
        code: 'NOT_ENOUGH_WORDS'
      });
    }
    
    // Shuffle and take limit
    let limit = parseInt(req.query.limit);
    if (!limit || limit <= 0) {
      limit = Math.min(words.length, 10); // Default to 10 or less if not enough words
    }
    
    const shuffled = [...words].sort(() => Math.random() - 0.5).slice(0, limit);
    
    const questions = shuffled.map(word => {
      // Get 3 wrong options from all words in the set
      const wrongOptions = allWords
        .filter(w => w.id !== word.id)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3)
        .map(w => w.meaning);
      
      const options = [...wrongOptions, word.meaning].sort(() => Math.random() - 0.5);
      const correctIndex = options.indexOf(word.meaning);
      
      return {
        id: word.id,
        word: word.word,
        phonetic: word.phonetic,
        options,
        correctIndex
      };
    });
    
    res.json({
      quiz: {
        setId: set.id,
        setName: set.name,
        type: 'multiple-choice',
        questions
      }
    });
  } catch (error) {
    console.error('Quiz generation error:', error);
    res.status(500).json({ error: 'Failed to generate quiz' });
  }
});

// Generate fill-in-the-blank quiz
router.get('/fill-blank/:setId', authenticateToken, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const set = await SetRepository.getById(req.params.setId);
    
    if (!set) {
      return res.status(404).json({ error: 'Vocabulary set not found' });
    }
    
    if (set.user_id !== req.user.id && !set.is_public) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const words = await WordRepository.getBySetId(req.params.setId);
    
    if (words.length < 4) {
      return res.status(400).json({ error: 'Set needs at least 4 words for a quiz' });
    }
    
    const shuffled = [...words].sort(() => Math.random() - 0.5).slice(0, limit);
    
    const questions = shuffled.map(word => {
      const hint = word.word.charAt(0) + '_'.repeat(word.word.length - 1);
      return {
        id: word.id,
        meaning: word.meaning,
        example: word.example,
        hint,
        answer: word.word
      };
    });
    
    res.json({
      quiz: {
        setId: set.id,
        setName: set.name,
        type: 'fill-blank',
        questions
      }
    });
  } catch (error) {
    console.error('Quiz generation error:', error);
    res.status(500).json({ error: 'Failed to generate quiz' });
  }
});

// Submit quiz result
router.post('/submit', authenticateToken, async (req, res) => {
  try {
    const { set_id, quiz_type, score, total_questions, time_taken } = req.body;
    
    if (!set_id || !quiz_type || score === undefined || !total_questions) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    await QuizRepository.saveResult(req.user.id, set_id, quiz_type, score, total_questions, time_taken);
    
    // Gamification updates
    await gamificationRepository.updateStreak(req.user.id);
    await gamificationRepository.updateQuizStats(req.user.id, score, total_questions, time_taken);
    
    // Award XP and points
    // 10 XP per correct answer, 50 bonus for perfect score
    const xpAwarded = (score * 10) + (score === total_questions ? 50 : 0);
    const pointsAwarded = Math.floor(score / 2); // 1 point for every 2 correct answers
    
    await gamificationRepository.addXP(req.user.id, xpAwarded, pointsAwarded);
    
    // Update daily challenges
    await gamificationRepository.updateChallengeProgress(req.user.id, 'daily_goal', score);
    if (score === total_questions) {
      await gamificationRepository.updateChallengeProgress(req.user.id, 'quiz_perfect', 1);
    }

    // Check for speed demon achievement
    if (score === total_questions && time_taken < 30) {
      await gamificationRepository.checkAndUnlockAchievement(req.user.id, 'speed_demon');
    }
    
    res.json({ 
      message: 'Quiz result saved',
      rewards: {
        xp: xpAwarded,
        points: pointsAwarded
      }
    });
  } catch (error) {
    console.error('Submit quiz error:', error);
    res.status(500).json({ error: 'Failed to save quiz result' });
  }
});

// Get quiz history
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const history = await QuizRepository.getHistory(req.user.id, limit);
    res.json({ history });
  } catch (error) {
    console.error('Get quiz history error:', error);
    res.status(500).json({ error: 'Failed to get quiz history', details: error.message });
  }
});

module.exports = router;
