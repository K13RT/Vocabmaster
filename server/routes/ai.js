const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { SetRepository, WordRepository } = require('../repositories');
const { getDatabase } = require('../config/database');

const router = express.Router();

// Groq API configuration
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

// Get all words a user already has
async function getUserExistingWords(userId) {
  const db = await getDatabase();
  const result = db.exec(`
    SELECT DISTINCT LOWER(w.word) as word
    FROM words w
    JOIN vocabulary_sets vs ON vs.id = w.set_id
    WHERE vs.user_id = ?
  `, [userId]);
  
  if (!result.length) return [];
  return result[0].values.map(row => row[0]);
}

// Generate vocabulary with AI
router.post('/generate-vocabulary', authenticateToken, async (req, res) => {
  try {
    const { topic, level, count = 20 } = req.body;
    
    if (!topic) {
      return res.status(400).json({ error: 'Topic is required' });
    }
    
    // Get existing words to avoid duplicates
    const existingWords = await getUserExistingWords(req.user.id);
    const excludeWordsText = existingWords.length > 0 
      ? `\n\nQUAN TRỌNG: KHÔNG tạo các từ sau vì người dùng đã có: ${existingWords.slice(0, 100).join(', ')}${existingWords.length > 100 ? '...' : ''}`
      : '';
    
    const levelMap = {
      'beginner': 'cơ bản (A1-A2), với các từ đơn giản, phổ biến trong đời sống hàng ngày',
      'intermediate': 'trung cấp (B1-B2), với các từ được sử dụng trong giao tiếp và công việc',
      'advanced': 'nâng cao (C1-C2), với các từ học thuật, chuyên môn và ít phổ biến hơn'
    };
    
    const levelDescription = levelMap[level] || levelMap['intermediate'];
    
    const prompt = `Bạn là một giáo viên tiếng Anh chuyên nghiệp. Hãy tạo danh sách ${count} từ vựng tiếng Anh về chủ đề "${topic}" ở trình độ ${levelDescription}.

Trả về CHÍNH XÁC theo định dạng JSON sau (không thêm bất kỳ text nào khác):
{
  "words": [
    {
      "word": "từ tiếng Anh",
      "meaning": "nghĩa tiếng Việt",
      "phonetic": "phiên âm IPA",
      "type": "loại từ (noun/verb/adjective/adverb/phrase)",
      "example": "câu ví dụ bằng tiếng Anh",
      "example_vietnamese": "dịch câu ví dụ sang tiếng Việt",
      "explain": "giải thích ngắn gọn về cách sử dụng từ"
    }
  ]
}

Yêu cầu:
- Mỗi từ phải có đầy đủ tất cả các trường
- Phiên âm IPA phải chính xác
- Câu ví dụ phải tự nhiên và dễ hiểu
- Giải thích phải ngắn gọn nhưng hữu ích
- Chỉ trả về JSON, không có text khác
- Tạo các từ MỚI, KHÁC NHAU, không trùng lặp${excludeWordsText}`;

    console.log('Generating vocabulary for topic:', topic, 'level:', level);
    
    // Get user's API key from database
    const user = await (require('../repositories').UserRepository.getById(req.user.id));
    const fullUser = await (require('../repositories').UserRepository.getByUsername(user.username));
    const userApiKey = fullUser.ai_api_key;
    
    const apiKey = userApiKey || process.env.GROQ_API_KEY;
    
    if (!apiKey) {
      return res.status(400).json({ 
        error: 'AI API Key is missing. Please go to Settings to add your Groq API Key.',
        needsConfig: true 
      });
    }
    
    console.log('Using API Key:', userApiKey ? 'User-provided' : 'System-default');

    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 4096
      })
    });
    
    if (!response.ok) {
      const errorData = await response.text();
      console.error('Groq API error status:', response.status);
      console.error('Groq API error body:', errorData);
      return res.status(500).json({ error: 'Failed to generate vocabulary from AI', details: errorData });
    }
    
    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    
    if (!content) {
      console.error('No content in AI response:', data);
      return res.status(500).json({ error: 'No response from AI' });
    }
    
    console.log('AI Response Content:', content);
    
    // Parse the JSON response
    let vocabulary;
    try {
      // Try to extract JSON from the response (in case there's extra text)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        vocabulary = JSON.parse(jsonMatch[0]);
      } else {
        vocabulary = JSON.parse(content);
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', content);
      return res.status(500).json({ error: 'Failed to parse AI response', content });
    }
    
    if (!vocabulary.words || !Array.isArray(vocabulary.words)) {
      console.error('Invalid vocabulary format:', vocabulary);
      return res.status(500).json({ error: 'Invalid response format from AI' });
    }
    
    console.log(`Creating set with ${vocabulary.words.length} words...`);
    
    // Create a new vocabulary set
    const setName = `${topic} (AI Generated)`;
    const set = await SetRepository.create(
      req.user.id,
      setName,
      topic,
      `Bộ từ vựng về chủ đề "${topic}" được tạo bởi AI - Trình độ ${level || 'intermediate'}`,
      false // not public
    );
    
    // Add words to the set
    for (const wordData of vocabulary.words) {
      try {
        console.log('Adding word:', wordData.word);
        await WordRepository.create(
          set.id,
          wordData.word,
          wordData.meaning,
          wordData.example || null,
          wordData.phonetic || null,
          null, // audio_path
          wordData.type || null,
          wordData.explain || null,
          wordData.example_vietnamese || null
        );
      } catch (wordError) {
        console.error('Failed to create word:', wordData.word, wordError);
      }
    }
    
    res.json({
      success: true,
      set: set,
      wordCount: vocabulary.words.length,
      message: `Đã tạo thành công bộ từ vựng với ${vocabulary.words.length} từ!`
    });
    
  } catch (error) {
    console.error('AI generation error:', error);
    res.status(500).json({ error: 'Failed to generate vocabulary', details: error.message });
  }
});

module.exports = router;
