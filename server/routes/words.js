const express = require('express');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { WordRepository, SetRepository } = require('../repositories');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

// Configure multer for audio uploads
const useSupabaseStorage = false;

let storage;
storage = multer.diskStorage({
    destination: 'server/uploads/audio',
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      cb(null, `${uuidv4()}${ext}`);
    }
  });

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /mp3|wav|ogg|m4a|webm/;
    const ext = path.extname(file.originalname).toLowerCase().slice(1);
    // also check mimetype when available
    const mimeOk = file.mimetype ? file.mimetype.startsWith('audio/') : true;
    cb(null, allowedTypes.test(ext) && mimeOk);
  }
});

// Get words by set
router.get('/set/:setId', authenticateToken, async (req, res) => {
  try {
    const set = await SetRepository.getById(req.params.setId);
    
    if (!set) {
      return res.status(404).json({ error: 'Vocabulary set not found' });
    }
    
    if (set.user_id !== req.user.id && !set.is_public) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const words = await WordRepository.getBySetId(req.params.setId, req.user.id);
    res.json({ words, set });
  } catch (error) {
    console.error('Get words error:', error);
    res.status(500).json({ error: 'Failed to get words' });
  }
});

// Search words
router.get('/search', authenticateToken, async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) {
      return res.status(400).json({ error: 'Search query must be at least 2 characters' });
    }
    
    const words = await WordRepository.search(req.user.id, q);
    res.json({ words });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

// Create word
router.post('/', authenticateToken, upload.single('audio'), async (req, res) => {
  try {
    const { set_id, word, meaning, example, phonetic, type, explain, example_vietnamese } = req.body;
    
    if (!set_id || !word || !meaning) {
      return res.status(400).json({ error: 'Set ID, word, and meaning are required' });
    }
    
    const set = await SetRepository.getById(set_id);
    if (!set || set.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    if (set.is_locked && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'This set is locked for editing' });
    }
    
    let audioPath = null;
    if (req.file) {
      audioPath = `/uploads/audio/${req.file.filename}`;
    }

    const newWord = await WordRepository.create(set_id, word, meaning, example, phonetic, audioPath, type, explain, example_vietnamese);
    
    res.status(201).json({ word: newWord });
  } catch (error) {
    console.error('Create word error:', error);
    res.status(500).json({ error: 'Failed to create word' });
  }
});

// Update word
router.put('/:id', authenticateToken, upload.single('audio'), async (req, res) => {
  try {
    const existingWord = await WordRepository.getById(req.params.id);
    if (!existingWord) {
      return res.status(404).json({ error: 'Word not found' });
    }
    
    const set = await SetRepository.getById(existingWord.set_id);
    if (!set || set.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    if (set.is_locked && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'This set is locked for editing' });
    }
    
    const updateData = {};
    if (req.body.word !== undefined) updateData.word = req.body.word;
    if (req.body.meaning !== undefined) updateData.meaning = req.body.meaning;
    if (req.body.example !== undefined) updateData.example = req.body.example;
    if (req.body.phonetic !== undefined) updateData.phonetic = req.body.phonetic;
    if (req.body.type !== undefined) updateData.type = req.body.type;
    if (req.body.explain !== undefined) updateData.explain = req.body.explain;
    if (req.body.example_vietnamese !== undefined) updateData.example_vietnamese = req.body.example_vietnamese;
    if (req.file) {
      updateData.audio_path = `/uploads/audio/${req.file.filename}`;
    }
    
    const word = await WordRepository.update(req.params.id, updateData);
    res.json({ word });
  } catch (error) {
    console.error('Update word error:', error);
    res.status(500).json({ error: 'Failed to update word' });
  }
});

// Delete word
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const existingWord = await WordRepository.getById(req.params.id);
    if (!existingWord) {
      return res.status(404).json({ error: 'Word not found' });
    }
    
    const set = await SetRepository.getById(existingWord.set_id);
    if (!set || set.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    if (set.is_locked && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'This set is locked for editing' });
    }
    
    await WordRepository.delete(req.params.id);
    res.json({ message: 'Word deleted successfully' });
  } catch (error) {
    console.error('Delete word error:', error);
    res.status(500).json({ error: 'Failed to delete word' });
  }
});

module.exports = router;
