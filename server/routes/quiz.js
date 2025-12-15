const express = require('express');
const { WordRepository, SetRepository, QuizRepository } = require('../repositories');
const { authenticateToken } = require('../middleware/auth');

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
    
    // Get learned words (remembered = 1)
    const words = await QuizRepository.getLearnedWordsForQuiz(req.params.setId, req.user.id);
    
    // If no learned words, return helpful message
    if (words.length === 0) {
      return res.status(400).json({ 
        error: 'Bạn chưa học từ nào trong bộ từ này. Hãy học flashcard trước khi làm quiz!',
        code: 'NO_LEARNED_WORDS'
      });
    }
    
    if (words.length < 4) {
      return res.status(400).json({ 
        error: `Bạn cần học ít nhất 4 từ trước khi làm quiz. Hiện tại: ${words.length} từ đã học.`,
        code: 'NOT_ENOUGH_LEARNED_WORDS'
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
    
    res.json({ message: 'Quiz result saved' });
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
    res.status(500).json({ error: 'Failed to get quiz history' });
  }
});

module.exports = router;
