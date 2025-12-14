const supabase = require('../../lib/supabase');
const logger = require('../../lib/logger');

class WordRepository {
  async getBySetId(setId, userId = null) {
    const method = 'WordRepository.getBySetId';
    try {
      if (!setId) throw new Error('setId is required');
      const { data, error } = await supabase.from('words').select('*').eq('set_id', setId).order('created_at', { ascending: true });
      if (error) { logger.error(method + ' supabase error', { setId, error }); throw error; }
      if (!data) return [];

      if (!userId) return data;

      const wordIds = data.map(w => w.id);
      const { data: progresses, error: pErr } = await supabase.from('user_progress').select('word_id, is_favorite').in('word_id', wordIds).eq('user_id', userId);
      if (pErr) { logger.warn(method + ' progress fetch error', { pErr }); }
      const favMap = {};
      (progresses || []).forEach(p => { favMap[p.word_id] = p.is_favorite; });
      return data.map(w => ({ ...w, is_favorite: favMap[w.id] || 0 }));
    } catch (err) {
      logger.error(`${method} failed`, { setId, userId, err: err.message || err });
      throw err;
    }
  }

  async getById(id) {
    const method = 'WordRepository.getById';
    try {
      if (!id) return null;
      const { data, error } = await supabase.from('words').select('*').eq('id', id).maybeSingle();
      if (error) { logger.error(method + ' supabase error', { id, error }); throw error; }
      return data || null;
    } catch (err) {
      logger.error(`${method} failed`, { id, err: err.message || err });
      throw err;
    }
  }

  async search(userId, keyword) {
    const method = 'WordRepository.search';
    try {
      if (!userId) throw new Error('userId is required');
      if (!keyword) return [];
      const pattern = `%${keyword}%`;
      const { data, error } = await supabase.from('words')
        .select('*, vocabulary_sets(name)')
        .ilike('word', pattern)
        .or(`meaning.ilike.%${keyword}%`)
        .limit(50);
      if (error) { logger.error(method + ' supabase error', { keyword, error }); throw error; }
      return data || [];
    } catch (err) {
      logger.error(`${method} failed`, { userId, keyword, err: err.message || err });
      throw err;
    }
  }

  async create(setId, word, meaning, example, phonetic, audioPath, type, explain, exampleVietnamese) {
    const method = 'WordRepository.create';
    try {
      if (!setId || !word || !meaning) throw new Error('setId, word and meaning are required');
      const payload = {
        set_id: setId,
        word,
        meaning,
        example: example || null,
        phonetic: phonetic || null,
        audio_path: audioPath || null,
        type: type || null,
        explain: explain || null,
        example_vietnamese: exampleVietnamese || null
      };
      const { data, error } = await supabase.from('words').insert(payload).select().single();
      if (error) { logger.error(method + ' supabase error', { payload, error }); throw error; }
      logger.info(method + ' created word', { id: data.id, setId });
      return data;
    } catch (err) {
      logger.error(`${method} failed`, { setId, word, err: err.message || err });
      throw err;
    }
  }

  async update(id, data) {
    const method = 'WordRepository.update';
    try {
      if (!id) throw new Error('id is required');
      const updateData = {};
      if (data.word !== undefined) updateData.word = data.word;
      if (data.meaning !== undefined) updateData.meaning = data.meaning;
      if (data.example !== undefined) updateData.example = data.example;
      if (data.phonetic !== undefined) updateData.phonetic = data.phonetic;
      if (data.audio_path !== undefined) updateData.audio_path = data.audio_path;
      if (data.type !== undefined) updateData.type = data.type;
      if (data.explain !== undefined) updateData.explain = data.explain;
      if (data.example_vietnamese !== undefined) updateData.example_vietnamese = data.example_vietnamese;

      if (Object.keys(updateData).length === 0) return await this.getById(id);

      const { data: updated, error } = await supabase.from('words').update(updateData).eq('id', id).select().single();
      if (error) { logger.error(method + ' supabase error', { id, updateData, error }); throw error; }
      logger.info(method + ' updated word', { id });
      return updated;
    } catch (err) {
      logger.error(`${method} failed`, { id, err: err.message || err });
      throw err;
    }
  }

  async delete(id) {
    const method = 'WordRepository.delete';
    try {
      if (!id) throw new Error('id is required');
      const { error } = await supabase.from('words').delete().eq('id', id);
      if (error) { logger.error(method + ' supabase error', { id, error }); throw error; }
      logger.info(method + ' deleted word', { id });
      return { changes: 1 };
    } catch (err) {
      logger.error(`${method} failed`, { id, err: err.message || err });
      throw err;
    }
  }

  async getRandomWords(excludeIds = [], limit = 3) {
    const method = 'WordRepository.getRandomWords';
    try {
      limit = parseInt(limit) || 3; if (limit < 1) limit = 1; if (limit > 50) limit = 50;
      let query = supabase.from('words').select('*').order('RANDOM()');
      if (excludeIds && excludeIds.length) query = query.not('id', 'in', `(${excludeIds.join(',')})`);
      const { data, error } = await query.limit(limit);
      if (error) { logger.error(method + ' supabase error', { excludeIds, error }); throw error; }
      return data || [];
    } catch (err) {
      logger.error(`${method} failed`, { excludeIds, err: err.message || err });
      throw err;
    }
  }
}

module.exports = new WordRepository();
