const { getDatabase, saveDatabase } = require('../../config/database');

class GamificationRepository {
  async getStreak(userId) {
    const db = await getDatabase();
    const result = db.exec('SELECT * FROM user_streaks WHERE user_id = ?', [userId]);
    
    if (result.length > 0 && result[0].values.length > 0) {
      const row = result[0].values[0];
      const columns = result[0].columns;
      const streak = {};
      columns.forEach((col, index) => {
        streak[col] = row[index];
      });
      return streak;
    }
    
    // Create initial streak record
    db.run('INSERT INTO user_streaks (user_id) VALUES (?)', [userId]);
    saveDatabase();
    return { user_id: userId, current_streak: 0, longest_streak: 0, last_study_date: null, streak_freeze_count: 0 };
  }

  async updateStreak(userId) {
    const db = await getDatabase();
    const streak = await this.getStreak(userId);
    const today = new Date().toISOString().split('T')[0];
    
    if (streak.last_study_date === today) {
      return streak; // Already updated today
    }

    let newStreak = streak.current_streak;
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    if (streak.last_study_date === yesterdayStr) {
      newStreak += 1;
    } else if (streak.last_study_date === null || streak.last_study_date < yesterdayStr) {
      // If they missed a day, check for streak freeze
      if (streak.streak_freeze_count > 0 && streak.last_study_date !== null) {
        db.run('UPDATE user_streaks SET streak_freeze_count = streak_freeze_count - 1 WHERE user_id = ?', [userId]);
        newStreak += 1;
      } else {
        newStreak = 1;
      }
    }

    const longestStreak = Math.max(streak.longest_streak, newStreak);
    
    db.run(`
      UPDATE user_streaks 
      SET current_streak = ?, longest_streak = ?, last_study_date = ?
      WHERE user_id = ?
    `, [newStreak, longestStreak, today, userId]);
    
    saveDatabase();
    return { ...streak, current_streak: newStreak, longest_streak: longestStreak, last_study_date: today };
  }

  async getStats(userId) {
    const db = await getDatabase();
    const result = db.exec('SELECT * FROM user_stats WHERE user_id = ?', [userId]);
    
    if (result.length > 0 && result[0].values.length > 0) {
      const row = result[0].values[0];
      const columns = result[0].columns;
      const stats = {};
      columns.forEach((col, index) => {
        stats[col] = row[index];
      });
      return stats;
    }
    
    // Create initial stats record
    db.run('INSERT INTO user_stats (user_id) VALUES (?)', [userId]);
    saveDatabase();
    return { 
      user_id: userId, 
      total_words_learned: 0, 
      total_quizzes_completed: 0, 
      total_quiz_score: 0, 
      total_time_spent: 0,
      current_level: 1,
      current_xp: 0,
      total_points: 0,
      perfect_quizzes_count: 0
    };
  }

  async addXP(userId, xp, points = 0) {
    const db = await getDatabase();
    const stats = await this.getStats(userId);
    
    let newXP = stats.current_xp + xp;
    let newLevel = stats.current_level;
    let newPoints = stats.total_points + points;

    // Simple level up logic: 1000 XP per level
    while (newXP >= newLevel * 1000) {
      newXP -= newLevel * 1000;
      newLevel += 1;
    }

    db.run(`
      UPDATE user_stats 
      SET current_xp = ?, current_level = ?, total_points = ?
      WHERE user_id = ?
    `, [newXP, newLevel, newPoints, userId]);
    
    saveDatabase();
    return { ...stats, current_xp: newXP, current_level: newLevel, total_points: newPoints };
  }

  async updateQuizStats(userId, score, totalQuestions, timeTaken) {
    const db = await getDatabase();
    const stats = await this.getStats(userId);
    
    const isPerfect = score === totalQuestions;
    const perfectCount = stats.perfect_quizzes_count + (isPerfect ? 1 : 0);
    
    db.run(`
      UPDATE user_stats 
      SET total_quizzes_completed = total_quizzes_completed + 1,
          total_quiz_score = total_quiz_score + ?,
          total_time_spent = total_time_spent + ?,
          perfect_quizzes_count = ?
      WHERE user_id = ?
    `, [score, timeTaken, perfectCount, userId]);
    
    saveDatabase();
    
    // Check for achievements
    if (isPerfect) {
      await this.checkAndUnlockAchievement(userId, 'perfect_quiz');
    }
    
    return this.getStats(userId);
  }

  async getAchievements() {
    const db = await getDatabase();
    const result = db.exec('SELECT * FROM achievements');
    if (result.length === 0) return [];
    
    const columns = result[0].columns;
    return result[0].values.map(row => {
      const achievement = {};
      columns.forEach((col, index) => {
        achievement[col] = row[index];
      });
      return achievement;
    });
  }

  async getUserAchievements(userId) {
    const db = await getDatabase();
    const result = db.exec(`
      SELECT a.*, ua.unlocked_at, ua.progress 
      FROM achievements a
      JOIN user_achievements ua ON a.id = ua.achievement_id
      WHERE ua.user_id = ?
    `, [userId]);
    
    if (result.length === 0) return [];
    
    const columns = result[0].columns;
    return result[0].values.map(row => {
      const achievement = {};
      columns.forEach((col, index) => {
        achievement[col] = row[index];
      });
      return achievement;
    });
  }

  async checkAndUnlockAchievement(userId, code) {
    const db = await getDatabase();
    
    // Get achievement ID
    const achResult = db.exec('SELECT id, points_reward, xp_reward FROM achievements WHERE code = ?', [code]);
    if (achResult.length === 0 || achResult[0].values.length === 0) return null;
    
    const [achId, points, xp] = achResult[0].values[0];
    
    // Check if already unlocked
    const exists = db.exec('SELECT id FROM user_achievements WHERE user_id = ? AND achievement_id = ?', [userId, achId]);
    if (exists.length > 0 && exists[0].values.length > 0) return null;
    
    // Unlock
    db.run('INSERT INTO user_achievements (user_id, achievement_id) VALUES (?, ?)', [userId, achId]);
    
    // Award rewards
    await this.addXP(userId, xp, points);
    
    saveDatabase();
    return code;
  }

  async getLeaderboard(type = 'words') {
    const db = await getDatabase();
    let query = '';
    
    if (type === 'words') {
      query = `
        SELECT u.username, s.total_words_learned as value
        FROM user_stats s
        JOIN users u ON s.user_id = u.id
        ORDER BY s.total_words_learned DESC
        LIMIT 100
      `;
    } else if (type === 'xp') {
      query = `
        SELECT u.username, (s.current_level * 1000 + s.current_xp) as value
        FROM user_stats s
        JOIN users u ON s.user_id = u.id
        ORDER BY value DESC
        LIMIT 100
      `;
    } else if (type === 'streak') {
      query = `
        SELECT u.username, st.longest_streak as value
        FROM user_streaks st
        JOIN users u ON st.user_id = u.id
        ORDER BY st.longest_streak DESC
        LIMIT 100
      `;
    }

    const result = db.exec(query);
    if (result.length === 0) return [];
    
    const columns = result[0].columns;
    return result[0].values.map(row => {
      const entry = {};
      columns.forEach((col, index) => {
        entry[col] = row[index];
      });
      return entry;
    });
  }

  async getDailyChallenges(userId) {
    const db = await getDatabase();
    const today = new Date().toISOString().split('T')[0];
    
    const result = db.exec('SELECT * FROM daily_challenges WHERE user_id = ? AND challenge_date = ?', [userId, today]);
    
    if (result.length > 0 && result[0].values.length > 0) {
      const columns = result[0].columns;
      return result[0].values.map(row => {
        const challenge = {};
        columns.forEach((col, index) => {
          challenge[col] = row[index];
        });
        return challenge;
      });
    }
    
    // Create daily challenges if not exist
    const challenges = [
      ['daily_goal', 20, 50], // Learn 20 words
      ['quiz_perfect', 1, 100] // Get 1 perfect quiz
    ];
    
    for (const [type, target, reward] of challenges) {
      db.run(`
        INSERT INTO daily_challenges (user_id, challenge_date, challenge_type, target_value, reward_points)
        VALUES (?, ?, ?, ?, ?)
      `, [userId, today, type, target, reward]);
    }
    
    saveDatabase();
    return this.getDailyChallenges(userId);
  }

  async updateChallengeProgress(userId, type, increment = 1) {
    const db = await getDatabase();
    const today = new Date().toISOString().split('T')[0];
    
    db.run(`
      UPDATE daily_challenges 
      SET current_value = current_value + ?,
          completed = CASE WHEN current_value + ? >= target_value THEN 1 ELSE 0 END
      WHERE user_id = ? AND challenge_date = ? AND challenge_type = ? AND completed = 0
    `, [increment, increment, userId, today, type]);
    
    // If completed, award points
    const result = db.exec(`
      SELECT reward_points FROM daily_challenges 
      WHERE user_id = ? AND challenge_date = ? AND challenge_type = ? AND completed = 1
    `, [userId, today, type]);
    
    if (result.length > 0 && result[0].values.length > 0) {
      const points = result[0].values[0][0];
      await this.addXP(userId, 0, points);
    }
    
    saveDatabase();
  }
}

module.exports = new GamificationRepository();
