const supabase = require('../../lib/supabase');
const logger = require('../../lib/logger');

class ProgressRepository {
  async getByUserAndWord(userId, wordId) {
    const method = 'ProgressRepository.getByUserAndWord';
    try {
      if (!userId || !wordId) return null;
      const { data, error } = await supabase.from('user_progress').select('*').eq('user_id', userId).eq('word_id', wordId).maybeSingle();
      if (error) { logger.error(method + ' supabase error', { userId, wordId, error }); throw error; }
      return data || null;
    } catch (err) {
      logger.error(`${method} failed`, { userId, wordId, err: err.message || err });
      throw err;
    }
  }

  async getByUserId(userId) {
    const method = 'ProgressRepository.getByUserId';
    try {
      if (!userId) return [];
      const { data, error } = await supabase.from('user_progress').select('*, words(word, meaning), vocabulary_sets(name)').eq('user_id', userId).order('next_review', { ascending: true });
      if (error) { logger.error(method + ' supabase error', { userId, error }); throw error; }
      return data || [];
    } catch (err) {
      logger.error(`${method} failed`, { userId, err: err.message || err });
      throw err;
    }
  }

  async getDueWords(userId, limit = 20) {
    const method = 'ProgressRepository.getDueWords';
    try {
      if (!userId) return [];
      limit = parseInt(limit) || 20; if (limit < 1) limit = 1; if (limit > 200) limit = 200;
      const { data, error } = await supabase.from('user_progress')
        .select('*, words(*), vocabulary_sets(name)')
        .eq('user_id', userId)
        .lte('next_review', new Date().toISOString())
        .order('next_review', { ascending: true })
        .limit(limit);
      if (error) { logger.error(method + ' supabase error', { userId, error }); throw error; }
      return data || [];
    } catch (err) {
      logger.error(`${method} failed`, { userId, err: err.message || err });
      throw err;
    }
  }

  async getStats(userId) {
    const method = 'ProgressRepository.getStats';
    try {
      if (!userId) return { total: 0, learned: 0, inProgress: 0, notStarted: 0 };
      const { count: totalResult } = await supabase.from('words').select('id', { count: 'exact', head: true }).eq('vocabulary_sets.user_id', userId);
      const { count: learned } = await supabase.from('user_progress').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('remembered', true);
      const { count: inProgress } = await supabase.from('user_progress').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('remembered', false);
      const total = totalResult || 0;
      return { total, learned: learned || 0, inProgress: inProgress || 0, notStarted: Math.max(0, total - (learned || 0) - (inProgress || 0)) };
    } catch (err) {
      logger.error(`${method} failed`, { userId, err: err.message || err });
      throw err;
    }
  }

  async upsert(userId, wordId, remembered, quality = 3) {
    const method = 'ProgressRepository.upsert';
    try {
      if (!userId || !wordId) throw new Error('userId and wordId are required');
      const existing = await this.getByUserAndWord(userId, wordId);

      if (existing) {
        let ease_factor = existing.ease_factor || 2.5;
        let interval_days = existing.interval_days || 1;
        let review_count = existing.review_count || 0;

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

        const { data, error } = await supabase.from('user_progress').update({ remembered: remembered ? true : false, review_count: review_count + 1, last_reviewed: new Date().toISOString(), next_review: nextReview.toISOString(), ease_factor, interval_days }).match({ user_id: userId, word_id: wordId }).select().maybeSingle();
        if (error) { logger.error(method + ' supabase error', { userId, wordId, error }); throw error; }
        return data || await this.getByUserAndWord(userId, wordId);
      } else {
        const nextReview = new Date();
        nextReview.setDate(nextReview.getDate() + 1);
        const { data, error } = await supabase.from('user_progress').insert({ user_id: userId, word_id: wordId, remembered: remembered ? true : false, review_count: 1, last_reviewed: new Date().toISOString(), next_review: nextReview.toISOString() }).select().maybeSingle();
        if (error) { logger.error(method + ' supabase error', { userId, wordId, error }); throw error; }
        return data;
      }
    } catch (err) {
      logger.error(`${method} failed`, { userId, wordId, err: err.message || err });
      throw err;
    }
  }

  async resetProgress(userId, wordId) {
    const method = 'ProgressRepository.resetProgress';
    try {
      if (!userId || !wordId) throw new Error('userId and wordId are required');
      const { error } = await supabase.from('user_progress').delete().eq('user_id', userId).eq('word_id', wordId);
      if (error) { logger.error(method + ' supabase error', { userId, wordId, error }); throw error; }
      return { changes: 1 };
    } catch (err) {
      logger.error(`${method} failed`, { userId, wordId, err: err.message || err });
      throw err;
    }
  }

  async getDifficultWords(userId) {
    const method = 'ProgressRepository.getDifficultWords';
    try {
      if (!userId) return [];
      const { data, error } = await supabase.from('user_progress').select('*, words(*), vocabulary_sets(name)').eq('user_id', userId).eq('remembered', false).order('last_reviewed', { ascending: false });
      if (error) { logger.error(method + ' supabase error', { userId, error }); throw error; }
      return data || [];
    } catch (err) {
      logger.error(`${method} failed`, { userId, err: err.message || err });
      throw err;
    }
  }

  async toggleFavorite(userId, wordId) {
    const method = 'ProgressRepository.toggleFavorite';
    try {
      if (!userId || !wordId) throw new Error('userId and wordId are required');
      const existing = await this.getByUserAndWord(userId, wordId);
      if (existing) {
        const isFavorite = existing.is_favorite ? false : true;
        const { data, error } = await supabase.from('user_progress').update({ is_favorite: isFavorite }).match({ user_id: userId, word_id: wordId }).select().maybeSingle();
        if (error) { logger.error(method + ' supabase error', { userId, wordId, error }); throw error; }
        return { is_favorite: isFavorite ? 1 : 0 };
      } else {
        const nextReview = new Date();
        nextReview.setDate(nextReview.getDate() + 1);
        const { data, error } = await supabase.from('user_progress').insert({ user_id: userId, word_id: wordId, is_favorite: true, remembered: false, review_count: 0, last_reviewed: new Date().toISOString(), next_review: nextReview.toISOString() }).select().maybeSingle();
        if (error) { logger.error(method + ' supabase error', { userId, wordId, error }); throw error; }
        return { is_favorite: 1 };
      }
    } catch (err) {
      logger.error(`${method} failed`, { userId, wordId, err: err.message || err });
      throw err;
    }
  }
}

module.exports = new ProgressRepository();
