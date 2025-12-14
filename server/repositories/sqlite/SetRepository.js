const { getDatabase, saveDatabase } = require('../../config/database');

class SetRepository {
  async getByUserId(userId, page = 1, limit = 20) {
    const db = await getDatabase();
    const offset = (page - 1) * limit;
    
    const result = db.exec(`
      SELECT vs.id, vs.user_id, vs.name, vs.topic, vs.description, vs.is_public, vs.created_at,
             (SELECT COUNT(*) FROM words WHERE set_id = vs.id) as word_count
      FROM vocabulary_sets vs
      WHERE vs.user_id = ?
      ORDER BY vs.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `, [userId]);
    
    const sets = result.length ? result[0].values.map(row => ({
      id: row[0], user_id: row[1], name: row[2], topic: row[3], description: row[4],
      is_public: row[5], created_at: row[6], word_count: row[7]
    })) : [];
    
    const countResult = db.exec(`SELECT COUNT(*) FROM vocabulary_sets WHERE user_id = ?`, [userId]);
    const total = countResult.length ? countResult[0].values[0][0] : 0;
    
    return { sets, total, page, limit, totalPages: Math.ceil(total / limit) };
  }
  
  async getById(id) {
    const db = await getDatabase();
    const result = db.exec(`
      SELECT vs.id, vs.user_id, vs.name, vs.topic, vs.description, vs.is_public, vs.created_at,
             (SELECT COUNT(*) FROM words WHERE set_id = vs.id) as word_count
      FROM vocabulary_sets vs WHERE vs.id = ?
    `, [id]);
    
    if (!result.length || !result[0].values.length) return null;
    const row = result[0].values[0];
    return {
      id: row[0], user_id: row[1], name: row[2], topic: row[3], description: row[4],
      is_public: row[5], created_at: row[6], word_count: row[7]
    };
  }
  
  async getPublicSets(page = 1, limit = 20) {
    const db = await getDatabase();
    const offset = (page - 1) * limit;
    
    const result = db.exec(`
      SELECT vs.id, vs.user_id, vs.name, vs.topic, vs.description, vs.is_public, vs.created_at,
             u.username, (SELECT COUNT(*) FROM words WHERE set_id = vs.id) as word_count
      FROM vocabulary_sets vs
      JOIN users u ON u.id = vs.user_id
      WHERE vs.is_public = 1
      ORDER BY vs.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `);
    
    const sets = result.length ? result[0].values.map(row => ({
      id: row[0], user_id: row[1], name: row[2], topic: row[3], description: row[4],
      is_public: row[5], created_at: row[6], username: row[7], word_count: row[8]
    })) : [];
    
    const countResult = db.exec(`SELECT COUNT(*) FROM vocabulary_sets WHERE is_public = 1`);
    const total = countResult.length ? countResult[0].values[0][0] : 0;
    
    return { sets, total, page, limit, totalPages: Math.ceil(total / limit) };
  }
  
  async create(userId, name, topic, description, isPublic = false) {
    const db = await getDatabase();
    const stmt = db.prepare(`INSERT INTO vocabulary_sets (user_id, name, topic, description, is_public) VALUES (?, ?, ?, ?, ?)`);
    stmt.run([userId, name, topic, description, isPublic ? 1 : 0]);
    stmt.free();
    const result = db.exec(`SELECT last_insert_rowid() as id`);
    const id = result[0].values[0][0];
    saveDatabase();
    return await this.getById(id);
  }
  
  async update(id, data) {
    const db = await getDatabase();
    const fields = [];
    const values = [];
    
    if (data.name !== undefined) { fields.push('name = ?'); values.push(data.name); }
    if (data.topic !== undefined) { fields.push('topic = ?'); values.push(data.topic); }
    if (data.description !== undefined) { fields.push('description = ?'); values.push(data.description); }
    if (data.is_public !== undefined) { fields.push('is_public = ?'); values.push(data.is_public ? 1 : 0); }
    
    if (fields.length === 0) return await this.getById(id);
    
    values.push(id);
    db.run(`UPDATE vocabulary_sets SET ${fields.join(', ')} WHERE id = ?`, values);
    saveDatabase();
    return await this.getById(id);
  }
  
  async delete(id) {
    const db = await getDatabase();
    db.run(`DELETE FROM vocabulary_sets WHERE id = ?`, [id]);
    saveDatabase();
    return { changes: 1 };
  }
}

module.exports = new SetRepository();
