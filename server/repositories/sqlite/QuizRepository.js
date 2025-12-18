const { getDatabase, saveDatabase } = require('../../config/database');

class QuizRepository {
  async getLearnedWordsForQuiz(setId, userId) {
    const db = await getDatabase();
    const result = db.exec(`
      SELECT w.* 
      FROM words w
      JOIN user_progress up ON up.word_id = w.id
      WHERE w.set_id = ? AND up.user_id = ? AND up.remembered = 1
    `, [setId, userId]);

    if (!result.length) return [];
    
    const columns = result[0].columns;
    return result[0].values.map(row => {
      const obj = {};
      columns.forEach((col, i) => obj[col] = row[i]);
      return obj;
    });
  }

  async saveResult(userId, setId, quizType, score, totalQuestions, timeTaken) {
    const db = await getDatabase();
    const stmt = db.prepare(`
      INSERT INTO quiz_results (user_id, set_id, quiz_type, score, total_questions, time_taken)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    stmt.run([userId, setId, quizType, score, totalQuestions, timeTaken]);
    stmt.free();
    
    const idResult = db.exec(`SELECT last_insert_rowid() as id`);
    const id = idResult[0].values[0][0];
    saveDatabase();
    
    const result = db.exec(`SELECT * FROM quiz_results WHERE id = ?`, [id]);
    if (!result.length) return null;
    
    const columns = result[0].columns;
    const row = result[0].values[0];
    const obj = {};
    columns.forEach((col, i) => obj[col] = row[i]);
    return obj;
  }

  async getHistory(userId, limit = 20) {
    const db = await getDatabase();
    const result = db.exec(`
      SELECT qr.*, vs.name as set_name
      FROM quiz_results qr
      LEFT JOIN vocabulary_sets vs ON vs.id = qr.set_id
      WHERE qr.user_id = ?
      ORDER BY qr.created_at DESC
      LIMIT ?
    `, [userId, limit]);

    if (!result.length) return [];
    
    const columns = result[0].columns;
    return result[0].values.map(row => {
      const obj = {};
      columns.forEach((col, i) => obj[col] = row[i]);
      return obj;
    });
  }
}

module.exports = new QuizRepository();
