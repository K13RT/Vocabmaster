const { getDatabase, saveDatabase } = require('../../config/database');

class ProgressRepository {
  async getByUserAndWord(userId, wordId) {
    const db = await getDatabase();
    const result = db.exec(`SELECT * FROM user_progress WHERE user_id = ? AND word_id = ?`, [userId, wordId]);
    if (!result.length || !result[0].values.length) return null;
    const cols = result[0].columns;
    const row = result[0].values[0];
    return cols.reduce((obj, col, i) => { obj[col] = row[i]; return obj; }, {});
  }
  
  async getByUserId(userId) {
    const db = await getDatabase();
    const result = db.exec(`
      SELECT up.*, w.word, w.meaning, vs.name as set_name
      FROM user_progress up
      JOIN words w ON w.id = up.word_id
      JOIN vocabulary_sets vs ON vs.id = w.set_id
      WHERE up.user_id = ?
      ORDER BY up.next_review ASC
    `, [userId]);
    
    if (!result.length) return [];
    return result[0].values.map(row => {
      const cols = result[0].columns;
      return cols.reduce((obj, col, i) => { obj[col] = row[i]; return obj; }, {});
    });
  }
  
  async getDueWords(userId, limit = 20) {
    const db = await getDatabase();
    const result = db.exec(`
      SELECT up.*, w.*, vs.name as set_name
      FROM user_progress up
      JOIN words w ON w.id = up.word_id
      JOIN vocabulary_sets vs ON vs.id = w.set_id
      WHERE up.user_id = ? AND up.next_review <= datetime('now')
      ORDER BY up.next_review ASC
      LIMIT ${limit}
    `, [userId]);
    
    if (!result.length) return [];
    return result[0].values.map(row => {
      const cols = result[0].columns;
      return cols.reduce((obj, col, i) => { obj[col] = row[i]; return obj; }, {});
    });
  }
  
  async getStats(userId) {
    const db = await getDatabase();
    
    const totalResult = db.exec(`
      SELECT COUNT(*) FROM words w
      JOIN vocabulary_sets vs ON vs.id = w.set_id
      WHERE vs.user_id = ?
    `, [userId]);
    const total = totalResult.length ? totalResult[0].values[0][0] : 0;
    
    const learnedResult = db.exec(`SELECT COUNT(*) FROM user_progress WHERE user_id = ? AND remembered = 1`, [userId]);
    const learned = learnedResult.length ? learnedResult[0].values[0][0] : 0;
    
    const inProgressResult = db.exec(`SELECT COUNT(*) FROM user_progress WHERE user_id = ? AND remembered = 0`, [userId]);
    const inProgress = inProgressResult.length ? inProgressResult[0].values[0][0] : 0;
    
    return {
      total,
      learned,
      inProgress,
      notStarted: Math.max(0, total - learned - inProgress)
    };
  }
  
  async upsert(userId, wordId, remembered, quality = 3) {
    const db = await getDatabase();
    const existing = await this.getByUserAndWord(userId, wordId);
    
    if (existing) {
      let { ease_factor, interval_days, review_count } = existing;
      ease_factor = ease_factor || 2.5;
      interval_days = interval_days || 1;
      review_count = review_count || 0;
      
      ease_factor = Math.max(1.3, ease_factor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)));
      
      if (quality >= 3) {
        if (review_count === 0) interval_days = 1;
        else if (review_count === 1) interval_days = 6;
        else interval_days = Math.round(interval_days * ease_factor);
      } else {
        interval_days = 1;
      }
      
      const nextReview = new Date();
      nextReview.setDate(nextReview.getDate() + interval_days);
      
      db.run(`
        UPDATE user_progress 
        SET remembered = ?, review_count = review_count + 1, 
            last_reviewed = datetime('now'), next_review = ?,
            ease_factor = ?, interval_days = ?
        WHERE user_id = ? AND word_id = ?
      `, [remembered ? 1 : 0, nextReview.toISOString(), ease_factor, interval_days, userId, wordId]);
    } else {
      const nextReview = new Date();
      nextReview.setDate(nextReview.getDate() + 1);
      
      db.run(`
        INSERT INTO user_progress (user_id, word_id, remembered, review_count, last_reviewed, next_review)
        VALUES (?, ?, ?, 1, datetime('now'), ?)
      `, [userId, wordId, remembered ? 1 : 0, nextReview.toISOString()]);
    }
    
    saveDatabase();
    return await this.getByUserAndWord(userId, wordId);
  }
  
  async resetProgress(userId, wordId) {
    const db = await getDatabase();
    db.run(`DELETE FROM user_progress WHERE user_id = ? AND word_id = ?`, [userId, wordId]);
    saveDatabase();
    return { changes: 1 };
  }

  async getDifficultWords(userId) {
    const db = await getDatabase();
    const result = db.exec(`
      SELECT up.*, w.*, vs.name as set_name
      FROM user_progress up
      JOIN words w ON w.id = up.word_id
      JOIN vocabulary_sets vs ON vs.id = w.set_id
      WHERE up.user_id = ? AND up.remembered = 0
      ORDER BY up.last_reviewed DESC
    `, [userId]);
    
    if (!result.length) return [];
    return result[0].values.map(row => {
      const cols = result[0].columns;
      return cols.reduce((obj, col, i) => { obj[col] = row[i]; return obj; }, {});
    });
  }

  async toggleFavorite(userId, wordId) {
    const db = await getDatabase();
    const existing = await this.getByUserAndWord(userId, wordId);
    
    let isFavorite = 1;
    
    if (existing) {
      isFavorite = existing.is_favorite ? 0 : 1;
      db.run(`UPDATE user_progress SET is_favorite = ? WHERE user_id = ? AND word_id = ?`, [isFavorite, userId, wordId]);
    } else {
      // Create new progress entry with favorite=1
      const nextReview = new Date();
      nextReview.setDate(nextReview.getDate() + 1);
      
      db.run(`
        INSERT INTO user_progress (user_id, word_id, is_favorite, remembered, review_count, last_reviewed, next_review)
        VALUES (?, ?, 1, 0, 0, datetime('now'), ?)
      `, [userId, wordId, nextReview.toISOString()]);
    }
    
    saveDatabase();
    return { is_favorite: isFavorite };
  }
  async getLearnedWords(userId) {
    const db = await getDatabase();
    const result = db.exec(`
      SELECT up.*, w.*, vs.name as set_name
      FROM user_progress up
      JOIN words w ON w.id = up.word_id
      JOIN vocabulary_sets vs ON vs.id = w.set_id
      WHERE up.user_id = ? AND up.remembered = 1
      ORDER BY up.last_reviewed DESC
    `, [userId]);
    
    if (!result.length) return [];
    return result[0].values.map(row => {
      const cols = result[0].columns;
      return cols.reduce((obj, col, i) => { obj[col] = row[i]; return obj; }, {});
    });
  }

  async getSetProgress(userId) {
    const db = await getDatabase();
    // Get total words per set
    const totalResult = db.exec(`
      SELECT set_id, COUNT(*) as total_count
      FROM words
      GROUP BY set_id
    `);
    
    const totals = {};
    if (totalResult.length) {
      totalResult[0].values.forEach(row => {
        totals[row[0]] = row[1];
      });
    }

    // Get learned words per set for user
    const learnedResult = db.exec(`
      SELECT w.set_id, COUNT(*) as learned_count
      FROM user_progress up
      JOIN words w ON w.id = up.word_id
      WHERE up.user_id = ? AND up.remembered = 1
      GROUP BY w.set_id
    `, [userId]);

    const learned = {};
    if (learnedResult.length) {
      learnedResult[0].values.forEach(row => {
        learned[row[0]] = row[1];
      });
    }

    return Object.keys(totals).map(setId => ({
      set_id: parseInt(setId),
      total: totals[setId] || 0,
      learned: learned[setId] || 0,
      is_completed: (totals[setId] || 0) > 0 && (learned[setId] || 0) >= (totals[setId] || 0)
    }));
  }

  async getLearnedWordsCount(userId) {
    const db = await getDatabase();
    const result = db.exec(`SELECT COUNT(*) FROM user_progress WHERE user_id = ? AND remembered = 1`, [userId]);
    return result.length ? result[0].values[0][0] : 0;
  }
}

module.exports = new ProgressRepository();
