const express = require('express');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { getDatabase, saveDatabase } = require('../config/database');
const { SetRepository, WordRepository } = require('../repositories');

const router = express.Router();

// Get all admin tests (admin only)
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const db = await getDatabase();
    const result = db.exec(`
      SELECT t.*, u.username as created_by_name,
        (SELECT COUNT(*) FROM admin_test_words WHERE test_id = t.id) as word_count,
        (SELECT COUNT(*) FROM admin_test_assignments WHERE test_id = t.id) as assigned_count
      FROM admin_tests t
      LEFT JOIN users u ON t.created_by = u.id
      ORDER BY t.created_at DESC
    `);
    
    if (!result.length) {
      return res.json({ tests: [] });
    }
    
    const tests = result[0].values.map(row => {
      const cols = result[0].columns;
      return cols.reduce((obj, col, i) => { obj[col] = row[i]; return obj; }, {});
    });
    
    res.json({ tests });
  } catch (error) {
    console.error('Get tests error:', error);
    res.status(500).json({ error: 'Failed to get tests' });
  }
});

// Create test from vocabulary set
router.post('/from-set', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { title, description, setId, wordCount = 10 } = req.body;
    
    if (!title || !setId) {
      return res.status(400).json({ error: 'Title and set ID are required' });
    }
    
    // Get words from the set
    const words = await WordRepository.getBySetId(setId);
    
    if (words.length < 4) {
      return res.status(400).json({ error: 'Set needs at least 4 words for a test' });
    }
    
    const db = await getDatabase();
    
    // Create test
    db.run(`
      INSERT INTO admin_tests (title, description, source_set_id, word_count, created_by)
      VALUES (?, ?, ?, ?, ?)
    `, [title, description || '', setId, wordCount, req.user.id]);
    
    const testIdResult = db.exec('SELECT last_insert_rowid()');
    const testId = testIdResult[0].values[0][0];
    
    // Shuffle and select words
    const shuffled = [...words].sort(() => Math.random() - 0.5);
    const selectedWords = shuffled.slice(0, Math.min(wordCount, words.length));
    
    // Add words to test
    for (const word of selectedWords) {
      db.run(`
        INSERT INTO admin_test_words (test_id, word_id, word, meaning, phonetic)
        VALUES (?, ?, ?, ?, ?)
      `, [testId, word.id, word.word, word.meaning, word.phonetic || '']);
    }
    
    saveDatabase();
    
    res.json({
      success: true,
      testId,
      message: `Đã tạo bài kiểm tra với ${selectedWords.length} từ!`
    });
  } catch (error) {
    console.error('Create test error:', error);
    res.status(500).json({ error: 'Failed to create test' });
  }
});

// Create test manually
router.post('/manual', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { title, description, words } = req.body;
    
    if (!title || !words || !Array.isArray(words) || words.length < 4) {
      return res.status(400).json({ error: 'Title and at least 4 words are required' });
    }
    
    const db = await getDatabase();
    
    // Create test
    db.run(`
      INSERT INTO admin_tests (title, description, word_count, created_by)
      VALUES (?, ?, ?, ?)
    `, [title, description || '', words.length, req.user.id]);
    
    const testIdResult = db.exec('SELECT last_insert_rowid()');
    const testId = testIdResult[0].values[0][0];
    
    // Add words to test
    for (const word of words) {
      db.run(`
        INSERT INTO admin_test_words (test_id, word, meaning, phonetic)
        VALUES (?, ?, ?, ?)
      `, [testId, word.word, word.meaning, word.phonetic || '']);
    }
    
    saveDatabase();
    
    res.json({
      success: true,
      testId,
      message: `Đã tạo bài kiểm tra với ${words.length} từ!`
    });
  } catch (error) {
    console.error('Create manual test error:', error);
    res.status(500).json({ error: 'Failed to create test' });
  }
});

// Assign test to users
router.post('/:testId/assign', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { testId } = req.params;
    const { userIds } = req.body;
    
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ error: 'User IDs are required' });
    }
    
    const db = await getDatabase();
    
    let assignedCount = 0;
    for (const userId of userIds) {
      try {
        db.run(`
          INSERT OR IGNORE INTO admin_test_assignments (test_id, user_id)
          VALUES (?, ?)
        `, [testId, userId]);
        assignedCount++;
      } catch (e) {
        // Ignore duplicates
      }
    }
    
    saveDatabase();
    
    res.json({
      success: true,
      assignedCount,
      message: `Đã giao bài kiểm tra cho ${assignedCount} người dùng!`
    });
  } catch (error) {
    console.error('Assign test error:', error);
    res.status(500).json({ error: 'Failed to assign test' });
  }
});

// Get assigned tests for current user
router.get('/assigned', authenticateToken, async (req, res) => {
  try {
    const db = await getDatabase();
    const result = db.exec(`
      SELECT 
        a.*,
        t.title,
        t.description,
        t.word_count,
        u.username as created_by_name
      FROM admin_test_assignments a
      JOIN admin_tests t ON a.test_id = t.id
      LEFT JOIN users u ON t.created_by = u.id
      WHERE a.user_id = ?
      ORDER BY a.assigned_at DESC
    `, [req.user.id]);
    
    if (!result.length) {
      return res.json({ tests: [] });
    }
    
    const tests = result[0].values.map(row => {
      const cols = result[0].columns;
      return cols.reduce((obj, col, i) => { obj[col] = row[i]; return obj; }, {});
    });
    
    res.json({ tests });
  } catch (error) {
    console.error('Get assigned tests error:', error);
    res.status(500).json({ error: 'Failed to get assigned tests' });
  }
});

// Get test results (admin)
router.get('/:testId/results', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { testId } = req.params;
    const db = await getDatabase();
    const result = db.exec(`
      SELECT a.user_id, u.username, u.email, a.score, a.total_questions, a.completed_at, a.assigned_at
      FROM admin_test_assignments a
      JOIN users u ON u.id = a.user_id
      WHERE a.test_id = ?
      ORDER BY a.completed_at DESC NULLS LAST, a.assigned_at DESC
    `, [testId]);
    
    const rows = result.length ? result[0].values.map(row => {
      const cols = result[0].columns;
      return cols.reduce((obj, col, i) => { obj[col] = row[i]; return obj; }, {});
    }) : [];
    
    res.json({ results: rows });
  } catch (error) {
    console.error('Get test results error:', error);
    res.status(500).json({ error: 'Failed to get test results' });
  }
});

// Get test for taking (user)
router.get('/:testId/take', authenticateToken, async (req, res) => {
  try {
    const { testId } = req.params;
    const db = await getDatabase();
    
    // Check assignment
    const assignmentResult = db.exec(`
      SELECT * FROM admin_test_assignments
      WHERE test_id = ? AND user_id = ?
    `, [testId, req.user.id]);
    
    if (!assignmentResult.length || !assignmentResult[0].values.length) {
      return res.status(403).json({ error: 'You are not assigned to this test' });
    }
    
    const assignment = assignmentResult[0].columns.reduce((obj, col, i) => {
      obj[col] = assignmentResult[0].values[0][i];
      return obj;
    }, {});
    
    if (assignment.completed_at) {
      return res.status(400).json({ 
        error: 'You have already completed this test',
        score: assignment.score,
        total: assignment.total_questions
      });
    }
    
    // Get test info
    const testResult = db.exec(`
      SELECT * FROM admin_tests WHERE id = ?
    `, [testId]);
    
    if (!testResult.length) {
      return res.status(404).json({ error: 'Test not found' });
    }
    
    const test = testResult[0].columns.reduce((obj, col, i) => {
      obj[col] = testResult[0].values[0][i];
      return obj;
    }, {});
    
    // Get test words
    const wordsResult = db.exec(`
      SELECT * FROM admin_test_words WHERE test_id = ?
    `, [testId]);
    
    const words = wordsResult.length ? wordsResult[0].values.map(row => {
      const cols = wordsResult[0].columns;
      return cols.reduce((obj, col, i) => { obj[col] = row[i]; return obj; }, {});
    }) : [];
    
    // Generate questions
    const shuffledWords = [...words].sort(() => Math.random() - 0.5);
    
    const questions = shuffledWords.map(word => {
      const wrongOptions = words
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
    
    // Mark as started
    db.run(`
      UPDATE admin_test_assignments SET started_at = CURRENT_TIMESTAMP
      WHERE test_id = ? AND user_id = ? AND started_at IS NULL
    `, [testId, req.user.id]);
    saveDatabase();
    
    res.json({
      test: {
        id: test.id,
        title: test.title,
        description: test.description
      },
      questions
    });
  } catch (error) {
    console.error('Get test error:', error);
    res.status(500).json({ error: 'Failed to get test' });
  }
});

// Submit test results
router.post('/:testId/submit', authenticateToken, async (req, res) => {
  try {
    const { testId } = req.params;
    const { score, totalQuestions } = req.body;
    
    const db = await getDatabase();
    
    db.run(`
      UPDATE admin_test_assignments 
      SET completed_at = CURRENT_TIMESTAMP, score = ?, total_questions = ?
      WHERE test_id = ? AND user_id = ?
    `, [score, totalQuestions, testId, req.user.id]);
    
    saveDatabase();
    
    res.json({
      success: true,
      message: 'Đã nộp bài kiểm tra!'
    });
  } catch (error) {
    console.error('Submit test error:', error);
    res.status(500).json({ error: 'Failed to submit test' });
  }
});

// Get all users for assignment (admin)
router.get('/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const db = await getDatabase();
    const result = db.exec(`
      SELECT id, username, email FROM users WHERE role != 'admin' AND is_active = 1
      ORDER BY username
    `);
    
    if (!result.length) {
      return res.json({ users: [] });
    }
    
    const users = result[0].values.map(row => ({
      id: row[0],
      username: row[1],
      email: row[2]
    }));
    
    res.json({ users });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to get users' });
  }
});

// Delete test
router.delete('/:testId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { testId } = req.params;
    const db = await getDatabase();
    
    db.run('DELETE FROM admin_tests WHERE id = ?', [testId]);
    saveDatabase();
    
    res.json({ success: true, message: 'Đã xóa bài kiểm tra!' });
  } catch (error) {
    console.error('Delete test error:', error);
    res.status(500).json({ error: 'Failed to delete test' });
  }
});

module.exports = router;
