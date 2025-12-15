const supabase = require('../../lib/supabase');
const logger = require('../../lib/logger');

class QuizRepository {
  async getLearnedWordsForQuiz(setId, userId) {
    const method = 'QuizRepository.getLearnedWordsForQuiz';
    try {
      // Join words and user_progress
      const { data, error } = await supabase
        .from('words')
        .select('*, user_progress!inner(remembered)')
        .eq('set_id', setId)
        .eq('user_progress.user_id', userId)
        .eq('user_progress.remembered', 1);

      if (error) { logger.error(method + ' supabase error', { setId, error }); throw error; }
      return data || [];
    } catch (err) {
      logger.error(`${method} failed`, { setId, userId, err: err.message || err });
      throw err;
    }
  }

  async saveResult(userId, setId, quizType, score, totalQuestions, timeTaken) {
    const method = 'QuizRepository.saveResult';
    try {
      const { data, error } = await supabase.from('quiz_results').insert({
        user_id: userId,
        set_id: setId,
        quiz_type: quizType,
        score,
        total_questions: totalQuestions,
        time_taken: timeTaken
      }).select().single();

      if (error) { logger.error(method + ' supabase error', { userId, setId, error }); throw error; }
      return data;
    } catch (err) {
      logger.error(`${method} failed`, { userId, setId, err: err.message || err });
      throw err;
    }
  }

  async getHistory(userId, limit = 20) {
    const method = 'QuizRepository.getHistory';
    try {
      const { data, error } = await supabase
        .from('quiz_results')
        .select('*, vocabulary_sets(name)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) { logger.error(method + ' supabase error', { userId, error }); throw error; }
      
      return data.map(row => ({
        ...row,
        set_name: row.vocabulary_sets?.name || 'Unknown Set'
      }));
    } catch (err) {
      logger.error(`${method} failed`, { userId, err: err.message || err });
      throw err;
    }
  }
}

module.exports = new QuizRepository();
