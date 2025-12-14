const { getDatabase } = require('../../config/database');

class AdminRepository {
  async getOverviewStats() {
    const db = await getDatabase();
    
    const usersResult = db.exec(`SELECT COUNT(*) FROM users WHERE role = 'user'`);
    const setsResult = db.exec(`SELECT COUNT(*) FROM vocabulary_sets`);
    const wordsResult = db.exec(`SELECT COUNT(*) FROM words`);
    const quizzesResult = db.exec(`SELECT COUNT(*) FROM quiz_results`);
    const activeResult = db.exec(`SELECT COUNT(DISTINCT user_id) FROM user_progress WHERE date(last_reviewed) = date('now')`);
    
    return {
      totalUsers: usersResult.length ? usersResult[0].values[0][0] : 0,
      totalSets: setsResult.length ? setsResult[0].values[0][0] : 0,
      totalWords: wordsResult.length ? wordsResult[0].values[0][0] : 0,
      totalQuizzes: quizzesResult.length ? quizzesResult[0].values[0][0] : 0,
      activeToday: activeResult.length ? activeResult[0].values[0][0] : 0
    };
  }
  
  async getWeeklyStats() {
    const db = await getDatabase();
    const result = db.exec(`
      SELECT 
        date(last_reviewed) as date,
        COUNT(*) as words_reviewed,
        COUNT(DISTINCT user_id) as active_users
      FROM user_progress
      WHERE last_reviewed >= datetime('now', '-7 days')
      GROUP BY date(last_reviewed)
      ORDER BY date ASC
    `);
    
    if (!result.length) return [];
    return result[0].values.map(row => ({
      date: row[0], words_reviewed: row[1], active_users: row[2]
    }));
  }
  
  async getMonthlyStats() {
    const db = await getDatabase();
    const result = db.exec(`
      SELECT 
        strftime('%Y-%W', last_reviewed) as week,
        COUNT(*) as words_reviewed,
        COUNT(DISTINCT user_id) as active_users
      FROM user_progress
      WHERE last_reviewed >= datetime('now', '-30 days')
      GROUP BY strftime('%Y-%W', last_reviewed)
      ORDER BY week ASC
    `);
    
    if (!result.length) return [];
    return result[0].values.map(row => ({
      week: row[0], words_reviewed: row[1], active_users: row[2]
    }));
  }
  
  async getYearlyStats() {
    const db = await getDatabase();
    const result = db.exec(`
      SELECT 
        strftime('%Y-%m', last_reviewed) as month,
        COUNT(*) as words_reviewed,
        COUNT(DISTINCT user_id) as active_users
      FROM user_progress
      WHERE last_reviewed >= datetime('now', '-365 days')
      GROUP BY strftime('%Y-%m', last_reviewed)
      ORDER BY month ASC
    `);
    
    if (!result.length) return [];
    return result[0].values.map(row => ({
      month: row[0], words_reviewed: row[1], active_users: row[2]
    }));
  }
  
  async getTopUsers(limit = 10) {
    const db = await getDatabase();
    const result = db.exec(`
      SELECT 
        u.id, u.username, u.email,
        COUNT(up.id) as total_reviews,
        SUM(CASE WHEN up.remembered = 1 THEN 1 ELSE 0 END) as words_learned
      FROM users u
      LEFT JOIN user_progress up ON up.user_id = u.id
      WHERE u.role = 'user'
      GROUP BY u.id
      ORDER BY words_learned DESC
      LIMIT ${limit}
    `);
    
    if (!result.length) return [];
    return result[0].values.map(row => ({
      id: row[0], username: row[1], email: row[2], total_reviews: row[3], words_learned: row[4] || 0
    }));
  }
  
  async getHardestWords(limit = 10) {
    const db = await getDatabase();
    const result = db.exec(`
      SELECT 
        w.word, w.meaning, vs.name as set_name,
        COUNT(up.id) as review_count,
        AVG(CASE WHEN up.remembered = 1 THEN 1.0 ELSE 0.0 END) as success_rate
      FROM words w
      JOIN vocabulary_sets vs ON vs.id = w.set_id
      JOIN user_progress up ON up.word_id = w.id
      GROUP BY w.id
      HAVING review_count >= 3
      ORDER BY success_rate ASC
      LIMIT ${limit}
    `);
    
    if (!result.length) return [];
    return result[0].values.map(row => ({
      word: row[0], meaning: row[1], set_name: row[2], review_count: row[3], success_rate: row[4]
    }));
  }
  
  async getUserDetailedStats(userId) {
    const db = await getDatabase();
    
    const userResult = db.exec(`SELECT id, username, email, role, is_active, created_at FROM users WHERE id = ?`, [userId]);
    if (!userResult.length || !userResult[0].values.length) return { user: null };
    const userRow = userResult[0].values[0];
    const user = { id: userRow[0], username: userRow[1], email: userRow[2], role: userRow[3], is_active: userRow[4], created_at: userRow[5] };
    
    const statsResult = db.exec(`
      SELECT COUNT(*) as total_reviews, SUM(CASE WHEN remembered = 1 THEN 1 ELSE 0 END) as words_learned
      FROM user_progress WHERE user_id = ?
    `, [userId]);
    const stats = statsResult.length ? { total_reviews: statsResult[0].values[0][0], words_learned: statsResult[0].values[0][1] || 0 } : {};
    
    const activityResult = db.exec(`
      SELECT date(last_reviewed) as date, COUNT(*) as words_reviewed
      FROM user_progress
      WHERE user_id = ? AND last_reviewed >= datetime('now', '-30 days')
      GROUP BY date(last_reviewed)
      ORDER BY date DESC
    `, [userId]);
    const recentActivity = activityResult.length ? activityResult[0].values.map(row => ({ date: row[0], words_reviewed: row[1] })) : [];
    
    const quizResult = db.exec(`
      SELECT quiz_type, AVG(score * 100.0 / total_questions) as avg_score, COUNT(*) as attempts
      FROM quiz_results WHERE user_id = ? GROUP BY quiz_type
    `, [userId]);
    const quizResults = quizResult.length ? quizResult[0].values.map(row => ({ quiz_type: row[0], avg_score: row[1], attempts: row[2] })) : [];
    
    return { user, stats, recentActivity, quizResults };
  }
}

module.exports = new AdminRepository();
