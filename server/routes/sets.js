const express = require('express');
const { SetRepository, WordRepository } = require('../repositories');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get user's sets
router.get('/', authenticateToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const result = await SetRepository.getByUserId(req.user.id, page);
    res.json(result);
  } catch (error) {
    console.error('Get sets error:', error);
    res.status(500).json({ error: 'Failed to get vocabulary sets' });
  }
});

// Get public sets
router.get('/public', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const result = await SetRepository.getPublicSets(page);
    res.json(result);
  } catch (error) {
    console.error('Get public sets error:', error);
    res.status(500).json({ error: 'Failed to get public vocabulary sets' });
  }
});

// Get single set with words
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const set = await SetRepository.getById(req.params.id);
    
    if (!set) {
      return res.status(404).json({ error: 'Vocabulary set not found' });
    }
    
    // Allow access to own sets or public sets
    if (set.user_id !== req.user.id && !set.is_public) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const words = await WordRepository.getBySetId(req.params.id);
    
    res.json({ set, words });
  } catch (error) {
    console.error('Get set error:', error);
    res.status(500).json({ error: 'Failed to get vocabulary set' });
  }
});

// Create set
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, topic, description, is_public } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Set name is required' });
    }
    
    const set = await SetRepository.create(req.user.id, name, topic, description, is_public);
    res.status(201).json({ set });
  } catch (error) {
    console.error('Create set error:', error);
    res.status(500).json({ error: 'Failed to create vocabulary set' });
  }
});

// Update set
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const existingSet = await SetRepository.getById(req.params.id);
    
    if (!existingSet) {
      return res.status(404).json({ error: 'Vocabulary set not found' });
    }
    
    // Owner or admin can update (admin for locking/shared library)
    const isOwner = existingSet.user_id === req.user.id;
    const isAdmin = req.user.role === 'admin';
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const { name, topic, description, is_public, is_locked } = req.body;
    const set = await SetRepository.update(req.params.id, { name, topic, description, is_public, is_locked });
    
    res.json({ set });
  } catch (error) {
    console.error('Update set error:', error);
    res.status(500).json({ error: 'Failed to update vocabulary set' });
  }
});

// Delete set
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const existingSet = await SetRepository.getById(req.params.id);
    
    if (!existingSet) {
      return res.status(404).json({ error: 'Vocabulary set not found' });
    }
    
    const isOwner = existingSet.user_id === req.user.id;
    const isAdmin = req.user.role === 'admin';
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    await SetRepository.delete(req.params.id);
    res.json({ message: 'Vocabulary set deleted successfully' });
  } catch (error) {
    console.error('Delete set error:', error);
    res.status(500).json({ error: 'Failed to delete vocabulary set' });
  }
});

// Import/Clone set
router.post('/import/:id', authenticateToken, async (req, res) => {
  try {
    const sourceSetId = req.params.id;
    const sourceSet = await SetRepository.getById(sourceSetId);
    
    if (!sourceSet) {
      return res.status(404).json({ error: 'Vocabulary set not found' });
    }
    
    // Allow import if public or owned by user
    if (!sourceSet.is_public && sourceSet.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Create new set
    const newName = `${sourceSet.name} (Copy)`;
    const newSet = await SetRepository.create(
      req.user.id,
      newName,
      sourceSet.topic,
      sourceSet.description,
      false // Private by default
    );
    
    // Get words from source set
    const words = await WordRepository.getBySetId(sourceSetId);
    
    // Copy words to new set
    for (const word of words) {
      await WordRepository.create(
        newSet.id,
        word.word,
        word.meaning,
        word.example,
        word.phonetic,
        word.audio_path
      );
    }
    
    res.status(201).json({ set: newSet });
  } catch (error) {
    console.error('Import set error:', error);
    res.status(500).json({ error: 'Failed to import vocabulary set' });
  }
});

// Import from Excel
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const supabase = require('../lib/supabase');
const useSupabaseStorage = process.env.USE_SUPABASE_STORAGE === 'true';
const SUPABASE_BUCKET = process.env.SUPABASE_STORAGE_BUCKET || 'audio';

const upload = multer({ storage: multer.memoryStorage() });
const xlsx = require('xlsx');

// Accept one excel file in field `file` and optional audio/files in field `files[]`
router.post('/import-excel', authenticateToken, upload.fields([
  { name: 'file', maxCount: 1 },
  { name: 'files', maxCount: 50 }
]), async (req, res) => {
  try {
    const excelFile = req.files && req.files['file'] && req.files['file'][0];
    if (!excelFile) {
      return res.status(400).json({ error: 'No Excel file uploaded (field name: file)' });
    }

    const workbook = xlsx.read(excelFile.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(worksheet);

    if (!data.length) {
      return res.status(400).json({ error: 'Excel file is empty' });
    }

    // Create new set
    const setName = req.body.name || `Imported Set ${new Date().toLocaleDateString()}`;
    const newSet = await SetRepository.create(
      req.user.id,
      setName,
      'Imported',
      'Imported from Excel',
      false
    );

    // Import words
    let successCount = 0;

    // Build uploaded files map by originalname for matching
    const uploadedFiles = req.files && req.files['files'] ? req.files['files'] : [];
    const fileMap = {};
    for (const f of uploadedFiles) {
      fileMap[f.originalname] = f; // keep last one if duplicates
    }

    for (const row of data) {
      // Map columns based on user's image: english, type, vietnamese, pronounce, explain, example, example_vietnamese
      const word = row['english'] || row['Word'] || row['word'];
      const meaning = row['vietnamese'] || row['Meaning'] || row['meaning'];
      
      if (word && meaning) {
        // Determine audio/file reference in row (common column names)
        let audioPath = null;
        const audioCell = row['audio'] || row['audio_filename'] || row['audio_path'] || row['file'] || row['file_name'] || row['filename'] || '';
        // If the cell contains an absolute URL, keep it
        if (audioCell && typeof audioCell === 'string' && audioCell.match(/^https?:\/\//i)) {
          audioPath = audioCell;
        } else if (audioCell && fileMap[audioCell]) {
          // We have a matching uploaded file by originalname
          const fileObj = fileMap[audioCell];
          const ext = path.extname(fileObj.originalname) || '.mp3';
          const filename = `${uuidv4()}${ext}`;
          if (useSupabaseStorage) {
            try {
              const storagePath = `sets/${newSet.id}/audio/${filename}`;
              const { data: uploadData, error: uploadErr } = await supabase.storage.from(SUPABASE_BUCKET).upload(storagePath, fileObj.buffer, { contentType: fileObj.mimetype });
              if (uploadErr) {
                console.error('Supabase upload error for imported file', uploadErr);
              } else {
                const { data: publicData } = supabase.storage.from(SUPABASE_BUCKET).getPublicUrl(uploadData.path);
                audioPath = publicData?.publicUrl || null;
              }
            } catch (e) {
              console.error('Supabase upload exception:', e);
            }
          } else {
            // Save locally to server/uploads/audio
            try {
              const dir = path.join(__dirname, '..', 'uploads', 'audio');
              if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
              const dest = path.join(dir, filename);
              fs.writeFileSync(dest, fileObj.buffer);
              audioPath = `/uploads/audio/${filename}`;
            } catch (e) {
              console.error('Local save error for imported file:', e);
            }
          }
        }

        await WordRepository.create(
          newSet.id,
          word,
          meaning,
          row['example'] || row['Example'] || '',
          row['pronounce'] || row['Phonetic'] || row['phonetic'] || '',
          audioPath,
          row['type'] || '',
          row['explain'] || '',
          row['example_vietnamese'] || ''
        );
        successCount++;
      }
    }

    res.status(201).json({ 
      message: 'Import successful', 
      set: newSet,
      count: successCount 
    });
  } catch (error) {
    console.error('Excel import error:', error);
    res.status(500).json({ error: 'Failed to import Excel file', details: error.message });
  }
});

module.exports = router;
