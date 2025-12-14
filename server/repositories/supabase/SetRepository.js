const supabase = require('../../lib/supabase');
const logger = require('../../lib/logger');

class SetRepository {
  async getByUserId(userId, page = 1, limit = 20) {
    const method = 'SetRepository.getByUserId';
    try {
      if (!userId) throw new Error('userId is required');
      page = parseInt(page) || 1; if (page < 1) page = 1;
      limit = parseInt(limit) || 20; if (limit < 1) limit = 20; if (limit > 200) limit = 200;

      const from = (page - 1) * limit;

      const { data, error, count } = await supabase.from('vocabulary_sets')
        .select('id, user_id, name, topic, description, is_public, created_at', { count: 'exact' })
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(from, from + limit - 1);

      if (error) { logger.error(method + ' supabase error', { userId, error }); throw error; }

      const sets = data || [];
      const setIds = sets.map(s => s.id);
      let counts = {};
      if (setIds.length) {
        const { data: wc, error: wcErr } = await supabase.rpc('get_word_counts_for_sets', { set_ids: setIds });
        if (wcErr) {
          logger.warn(method + ' rpc fallback', { rpcError: wcErr });
          for (const s of sets) {
            const { count: c } = await supabase.from('words').select('id', { count: 'exact', head: true }).eq('set_id', s.id);
            counts[s.id] = c || 0;
          }
        } else {
          for (const r of wc || []) counts[r.set_id] = r.count;
        }
      }

      const total = count || 0;
      const setsWithCount = sets.map(s => ({ ...s, word_count: counts[s.id] || 0 }));
      return { sets: setsWithCount, total, page, limit, totalPages: Math.ceil(total / limit) };
    } catch (err) {
      logger.error(`${method} failed`, { userId, page, limit, err: err.message || err });
      throw err;
    }
  }

  async getById(id) {
    const method = 'SetRepository.getById';
    try {
      if (!id) return null;
      const { data, error } = await supabase.from('vocabulary_sets').select('id, user_id, name, topic, description, is_public, created_at').eq('id', id).maybeSingle();
      if (error) { logger.error(method + ' supabase error', { id, error }); throw error; }
      if (!data) return null;
      const { count } = await supabase.from('words').select('id', { count: 'exact', head: true }).eq('set_id', id);
      return { ...data, word_count: count || 0 };
    } catch (err) {
      logger.error(`${method} failed`, { id, err: err.message || err });
      throw err;
    }
  }

  async getPublicSets(page = 1, limit = 20) {
    const method = 'SetRepository.getPublicSets';
    try {
      page = parseInt(page) || 1; if (page < 1) page = 1;
      limit = parseInt(limit) || 20; if (limit < 1) limit = 20; if (limit > 200) limit = 200;
      const from = (page - 1) * limit;

      const { data, error, count } = await supabase.from('vocabulary_sets')
        .select('id, user_id, name, topic, description, is_public, created_at, user:users(username)', { count: 'exact' })
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .range(from, from + limit - 1);

      if (error) { logger.error(method + ' supabase error', { error }); throw error; }
      const sets = (data || []).map(row => ({ id: row.id, user_id: row.user_id, name: row.name, topic: row.topic, description: row.description, is_public: row.is_public, created_at: row.created_at, username: row.user?.username || null }));
      const total = count || 0;
      return { sets, total, page, limit, totalPages: Math.ceil(total / limit) };
    } catch (err) {
      logger.error(`${method} failed`, { page, limit, err: err.message || err });
      throw err;
    }
  }

  async create(userId, name, topic, description, isPublic = false) {
    const method = 'SetRepository.create';
    try {
      if (!userId || !name) throw new Error('userId and name are required');
      const { data, error } = await supabase.from('vocabulary_sets').insert({ user_id: userId, name, topic, description, is_public: isPublic }).select().single();
      if (error) { logger.error(method + ' supabase error', { userId, name, error }); throw error; }
      logger.info(method + ' created set', { id: data.id, userId });
      return data;
    } catch (err) {
      logger.error(`${method} failed`, { userId, name, err: err.message || err });
      throw err;
    }
  }

  async update(id, data) {
    const method = 'SetRepository.update';
    try {
      if (!id) throw new Error('id is required');
      const updateData = {};
      if (data.name !== undefined) updateData.name = data.name;
      if (data.topic !== undefined) updateData.topic = data.topic;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.is_public !== undefined) updateData.is_public = data.is_public;
      if (data.is_locked !== undefined) updateData.is_locked = data.is_locked;

      if (Object.keys(updateData).length === 0) return await this.getById(id);

      const { data: updated, error } = await supabase.from('vocabulary_sets').update(updateData).eq('id', id).select().single();
      if (error) { logger.error(method + ' supabase error', { id, updateData, error }); throw error; }
      logger.info(method + ' updated set', { id });
      return updated;
    } catch (err) {
      logger.error(`${method} failed`, { id, err: err.message || err });
      throw err;
    }
  }

  async delete(id) {
    const method = 'SetRepository.delete';
    try {
      if (!id) throw new Error('id is required');
      const { error } = await supabase.from('vocabulary_sets').delete().eq('id', id);
      if (error) { logger.error(method + ' supabase error', { id, error }); throw error; }
      logger.info(method + ' deleted set', { id });
      return { changes: 1 };
    } catch (err) {
      logger.error(`${method} failed`, { id, err: err.message || err });
      throw err;
    }
  }
}

module.exports = new SetRepository();
