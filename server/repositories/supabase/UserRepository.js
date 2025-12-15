const supabase = require('../../lib/supabase');
const logger = require('../../lib/logger');

class UserRepository {
  async getAll(page = 1, limit = 20, search = '') {
    const method = 'UserRepository.getAll';
    try {
      page = parseInt(page) || 1; if (page < 1) page = 1;
      limit = parseInt(limit) || 20; if (limit < 1) limit = 20; if (limit > 200) limit = 200;

      const from = (page - 1) * limit;

      let query = supabase.from('users').select('id, username, email, role, is_active, created_at', { count: 'exact' }).order('created_at', { ascending: false });
      if (search) {
        query = query.ilike('username', `%${search}%`).or(`email.ilike.%${search}%`);
      }

      const { data, error, count } = await query.range(from, from + limit - 1);
      if (error) {
        logger.error(method + ' supabase error', { error });
        throw error;
      }

      const total = count || 0;
      return { users: data || [], total, page, limit, totalPages: Math.ceil(total / limit) };
    } catch (err) {
      logger.error(`${method} failed`, { page, limit, search, err: err.message || err });
      throw err;
    }
  }

  async getById(id) {
    const method = 'UserRepository.getById';
    try {
      if (!id) return null;
      const { data, error } = await supabase.from('users').select('id, username, email, role, is_active, created_at').eq('id', id).maybeSingle();
      if (error) {
        logger.error(method + ' supabase error', { id, error });
        throw error;
      }
      return data || null;
    } catch (err) {
      logger.error(`${method} failed`, { id, err: err.message || err });
      throw err;
    }
  }

  async getByUsername(username) {
    const method = 'UserRepository.getByUsername';
    try {
      if (!username) return null;
      const { data, error } = await supabase.from('users').select('*').eq('username', username).maybeSingle();
      if (error) {
        logger.error(method + ' supabase error', { username, error });
        throw error;
      }
      return data || null;
    } catch (err) {
      logger.error(`${method} failed`, { username, err: err.message || err });
      throw err;
    }
  }

  async getByEmail(email) {
    const method = 'UserRepository.getByEmail';
    try {
      if (!email) return null;
      const { data, error } = await supabase.from('users').select('*').eq('email', email).maybeSingle();
      if (error) {
        logger.error(method + ' supabase error', { email, error });
        throw error;
      }
      return data || null;
    } catch (err) {
      logger.error(`${method} failed`, { email, err: err.message || err });
      throw err;
    }
  }

  async create(username, email, passwordHash, role = 'user', id = null) {
    const method = 'UserRepository.create';
    try {
      if (!username || !email || !passwordHash) {
        throw new Error('username, email and passwordHash are required');
      }
      const insertData = { username, email, password_hash: passwordHash, role, is_active: true };
      if (id) insertData.id = id;
      
      const { data, error } = await supabase.from('users').insert(insertData).select().single();
      if (error) {
        logger.error(method + ' supabase error', { username, email, error });
        throw error;
      }
      logger.info(method + ' created user', { id: data.id, username: data.username });
      return data;
    } catch (err) {
      logger.error(`${method} failed`, { username, email, err: err.message || err });
      throw err;
    }
  }

  async update(id, data) {
    const method = 'UserRepository.update';
    try {
      if (!id) throw new Error('id is required');
      const updateData = {};
      if (data.role !== undefined) updateData.role = data.role;
      if (data.is_active !== undefined) updateData.is_active = data.is_active ? true : false;
      if (data.password_hash !== undefined) updateData.password_hash = data.password_hash;

      if (Object.keys(updateData).length === 0) return await this.getById(id);

      const { data: updated, error } = await supabase.from('users').update(updateData).eq('id', id).select().single();
      if (error) {
        logger.error(method + ' supabase error', { id, updateData, error });
        throw error;
      }
      logger.info(method + ' updated user', { id });
      return updated;
    } catch (err) {
      logger.error(`${method} failed`, { id, err: err.message || err });
      throw err;
    }
  }

  async delete(id) {
    const method = 'UserRepository.delete';
    try {
      if (!id) throw new Error('id is required');
      const { error } = await supabase.from('users').delete().eq('id', id);
      if (error) {
        logger.error(method + ' supabase error', { id, error });
        throw error;
      }
      logger.info(method + ' deleted user', { id });
      return { changes: 1 };
    } catch (err) {
      logger.error(`${method} failed`, { id, err: err.message || err });
      throw err;
    }
  }
}

module.exports = new UserRepository();
