const supabase = require('../../lib/supabase');
const logger = require('../../lib/logger');

class AdminRepository {
  async getOverviewStats() {
    const method = 'AdminRepository.getOverviewStats';
    try {
      const { count: usersCount } = await supabase.from('users').select('id', { count: 'exact', head: true }).neq('role', 'admin');
      const { count: setsCount } = await supabase.from('vocabulary_sets').select('id', { count: 'exact', head: true });
      const { count: wordsCount } = await supabase.from('words').select('id', { count: 'exact', head: true });
      const { count: quizzesCount } = await supabase.from('quiz_results').select('id', { count: 'exact', head: true });
      const todayStart = new Date(); todayStart.setHours(0,0,0,0);
      const { count: activeToday } = await supabase.from('user_progress').select('user_id', { count: 'exact', head: true }).gte('last_reviewed', todayStart.toISOString());
      return { totalUsers: usersCount || 0, totalSets: setsCount || 0, totalWords: wordsCount || 0, totalQuizzes: quizzesCount || 0, activeToday: activeToday || 0 };
    } catch (err) {
      logger.error(`${method} failed`, { err: err.message || err });
      throw err;
    }
  }

  async getWeeklyStats() {
    const method = 'AdminRepository.getWeeklyStats';
    try {
      const { data, error } = await supabase.rpc('admin_weekly_stats');
      if (error) { logger.error(method + ' rpc error', { error }); throw error; }
      return data || [];
    } catch (err) {
      logger.error(`${method} failed`, { err: err.message || err });
      throw err;
    }
  }

  async getMonthlyStats() {
    const method = 'AdminRepository.getMonthlyStats';
    try {
      const { data, error } = await supabase.rpc('admin_monthly_stats');
      if (error) { logger.error(method + ' rpc error', { error }); throw error; }
      return data || [];
    } catch (err) {
      logger.error(`${method} failed`, { err: err.message || err });
      throw err;
    }
  }

  async getYearlyStats() {
    const method = 'AdminRepository.getYearlyStats';
    try {
      const { data, error } = await supabase.rpc('admin_yearly_stats');
      if (error) { logger.error(method + ' rpc error', { error }); throw error; }
      return data || [];
    } catch (err) {
      logger.error(`${method} failed`, { err: err.message || err });
      throw err;
    }
  }

  async getTopUsers(limit = 10) {
    const method = 'AdminRepository.getTopUsers';
    try {
      limit = parseInt(limit) || 10; if (limit < 1) limit = 1; if (limit > 100) limit = 100;
      const { data, error } = await supabase.from('users')
        .select('id, username, email')
        .neq('role', 'admin')
        .limit(limit);
      if (error) { logger.error(method + ' supabase error', { error }); throw error; }
      return data || [];
    } catch (err) {
      logger.error(`${method} failed`, { limit, err: err.message || err });
      throw err;
    }
  }

  async getHardestWords(limit = 10) {
    const method = 'AdminRepository.getHardestWords';
    try {
      limit = parseInt(limit) || 10; if (limit < 1) limit = 1; if (limit > 100) limit = 100;
      const { data, error } = await supabase.rpc('admin_hardest_words', { p_limit: limit });
      if (error) { logger.error(method + ' rpc error', { error }); throw error; }
      return data || [];
    } catch (err) {
      logger.error(`${method} failed`, { limit, err: err.message || err });
      throw err;
    }
  }

  async getUserDetailedStats(userId) {
    const method = 'AdminRepository.getUserDetailedStats';
    try {
      if (!userId) return { user: null };
      const { data: userData, error: userErr } = await supabase.from('users').select('id, username, email, role, is_active, created_at').eq('id', userId).maybeSingle();
      if (userErr) { logger.error(method + ' supabase error', { userErr }); throw userErr; }
      if (!userData) return { user: null };

      const { data: statsData } = await supabase.from('user_progress').select('count:id, sum:remembered').eq('user_id', userId).maybeSingle().catch(() => ({ data: {} }));

      const { data: activityResult, error: activityErr } = await supabase.rpc('user_recent_activity', { p_user_id: userId });
      if (activityErr) { logger.warn(method + ' rpc warning', { activityErr }); }

      const { data: quizResult, error: quizErr } = await supabase.from('quiz_results').select('quiz_type, avg_score:score, attempts:count').eq('user_id', userId).catch(() => ({ data: [] }));
      if (quizErr) { logger.warn(method + ' quiz query warning', { quizErr }); }

      return { user: userData, stats: statsData || {}, recentActivity: activityResult || [], quizResults: quizResult || [] };
    } catch (err) {
      logger.error(`${method} failed`, { userId, err: err.message || err });
      throw err;
    }
  }
}

module.exports = new AdminRepository();
