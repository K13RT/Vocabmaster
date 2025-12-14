const { getDatabase, saveDatabase } = require('../../config/database');

class WordRepository {
  async getBySetId(setId, userId = null) {
    const db = await getDatabase();
    let query = `SELECT w.* FROM words w WHERE w.set_id = ? ORDER BY w.created_at ASC`;
    let params = [setId];

    if (userId) {
      query = `
        SELECT w.*, up.is_favorite 
        FROM words w 
        LEFT JOIN user_progress up ON w.id = up.word_id AND up.user_id = ?
        WHERE w.set_id = ? 
        ORDER BY w.created_at ASC
      `;
      params = [userId, setId];
    }

    const result = db.exec(query, params);
    if (!result.length) return [];
    return result[0].values.map(row => {
      const cols = result[0].columns;
      return cols.reduce((obj, col, i) => { obj[col] = row[i]; return obj; }, {});
    });
  }
  
  async getById(id) {
    const db = await getDatabase();
    const result = db.exec(`SELECT * FROM words WHERE id = ?`, [id]);
    if (!result.length || !result[0].values.length) return null;
    const cols = result[0].columns;
    const row = result[0].values[0];
    return cols.reduce((obj, col, i) => { obj[col] = row[i]; return obj; }, {});
  }
  
  async search(userId, keyword) {
    const db = await getDatabase();
    const pattern = `%${keyword}%`;
    const result = db.exec(`
      SELECT w.*, vs.name as set_name
      FROM words w
      JOIN vocabulary_sets vs ON vs.id = w.set_id
      WHERE vs.user_id = ? AND (w.word LIKE ? OR w.meaning LIKE ?)
      ORDER BY w.word ASC
      LIMIT 50
    `, [userId, pattern, pattern]);
    
    if (!result.length) return [];
    return result[0].values.map(row => {
      const cols = result[0].columns;
      return cols.reduce((obj, col, i) => { obj[col] = row[i]; return obj; }, {});
    });
  }
  
  async create(setId, word, meaning, example, phonetic, audioPath, type, explain, exampleVietnamese) {
    const db = await getDatabase();
    const stmt = db.prepare(`INSERT INTO words (set_id, word, meaning, example, phonetic, audio_path, type, explain, example_vietnamese) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);
    stmt.run([setId, word, meaning, example || null, phonetic || null, audioPath || null, type || null, explain || null, exampleVietnamese || null]);
    stmt.free();
    const result = db.exec(`SELECT last_insert_rowid() as id`);
    const id = result[0].values[0][0];
    saveDatabase();
    return await this.getById(id);
  }
  
  async update(id, data) {
    const db = await getDatabase();
    const fields = [];
    const values = [];
    
    if (data.word !== undefined) { fields.push('word = ?'); values.push(data.word); }
    if (data.meaning !== undefined) { fields.push('meaning = ?'); values.push(data.meaning); }
    if (data.example !== undefined) { fields.push('example = ?'); values.push(data.example); }
    if (data.phonetic !== undefined) { fields.push('phonetic = ?'); values.push(data.phonetic); }
    if (data.audio_path !== undefined) { fields.push('audio_path = ?'); values.push(data.audio_path); }
    if (data.type !== undefined) { fields.push('type = ?'); values.push(data.type); }
    if (data.explain !== undefined) { fields.push('explain = ?'); values.push(data.explain); }
    if (data.example_vietnamese !== undefined) { fields.push('example_vietnamese = ?'); values.push(data.example_vietnamese); }
    
    if (fields.length === 0) return await this.getById(id);
    
    values.push(id);
    db.run(`UPDATE words SET ${fields.join(', ')} WHERE id = ?`, values);
    saveDatabase();
    return await this.getById(id);
  }
  
  async delete(id) {
    const db = await getDatabase();
    db.run(`DELETE FROM words WHERE id = ?`, [id]);
    saveDatabase();
    return { changes: 1 };
  }
  
  async getRandomWords(excludeIds, limit = 3) {
    const db = await getDatabase();
    let result;
    if (!excludeIds.length) {
      result = db.exec(`SELECT * FROM words ORDER BY RANDOM() LIMIT ${limit}`);
    } else {
      const placeholders = excludeIds.map(() => '?').join(',');
      result = db.exec(`SELECT * FROM words WHERE id NOT IN (${placeholders}) ORDER BY RANDOM() LIMIT ${limit}`, [...excludeIds]);
    }
    if (!result.length) return [];
    return result[0].values.map(row => {
      const cols = result[0].columns;
      return cols.reduce((obj, col, i) => { obj[col] = row[i]; return obj; }, {});
    });
  }
}

module.exports = new WordRepository();
