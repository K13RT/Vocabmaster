const { getDatabase, saveDatabase } = require('../../config/database');

class UserRepository {
  async getAll(page = 1, limit = 20, search = '') {
    const db = await getDatabase();
    const offset = (page - 1) * limit;
    
    let users, total;
    
    if (search) {
      const searchPattern = `%${search}%`;
      const stmt = db.prepare(`SELECT id, username, email, role, is_active, created_at FROM users WHERE username LIKE ? OR email LIKE ? ORDER BY created_at DESC LIMIT ? OFFSET ?`);
      stmt.bind([searchPattern, searchPattern, limit, offset]);
      users = [];
      while (stmt.step()) {
        const row = stmt.getAsObject();
        users.push(row);
      }
      stmt.free();
      
      const countStmt = db.prepare(`SELECT COUNT(*) as total FROM users WHERE username LIKE ? OR email LIKE ?`);
      countStmt.bind([searchPattern, searchPattern]);
      countStmt.step();
      total = countStmt.getAsObject().total;
      countStmt.free();
    } else {
      const result = db.exec(`SELECT id, username, email, role, is_active, created_at FROM users ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`);
      users = result.length ? result[0].values.map(row => ({
        id: row[0], username: row[1], email: row[2], role: row[3], is_active: row[4], created_at: row[5]
      })) : [];
      const countResult = db.exec(`SELECT COUNT(*) as total FROM users`);
      total = countResult.length ? countResult[0].values[0][0] : 0;
    }
    
    return { users, total, page, limit, totalPages: Math.ceil(total / limit) };
  }
  
  async getById(id) {
    const db = await getDatabase();
    const stmt = db.prepare(`SELECT id, username, email, role, is_active, created_at FROM users WHERE id = ?`);
    stmt.bind([id]);
    if (stmt.step()) {
      const user = stmt.getAsObject();
      stmt.free();
      return user;
    }
    stmt.free();
    return null;
  }
  
  async getByUsername(username) {
    const db = await getDatabase();
    const stmt = db.prepare(`SELECT * FROM users WHERE username = ?`);
    stmt.bind([username]);
    if (stmt.step()) {
      const user = stmt.getAsObject();
      stmt.free();
      return user;
    }
    stmt.free();
    return null;
  }
  
  async getByEmail(email) {
    const db = await getDatabase();
    const stmt = db.prepare(`SELECT * FROM users WHERE email = ?`);
    stmt.bind([email]);
    if (stmt.step()) {
      const user = stmt.getAsObject();
      stmt.free();
      return user;
    }
    stmt.free();
    return null;
  }
  
  async create(username, email, passwordHash, role = 'user') {
    const db = await getDatabase();
    
    // Use prepared statement for INSERT
    const stmt = db.prepare(`INSERT INTO users (username, email, password_hash, role, is_active) VALUES (?, ?, ?, ?, 1)`);
    stmt.run([username, email, passwordHash, role]);
    stmt.free();
    
    // Get the newly inserted row ID - must query immediately after insert
    const idResult = db.exec(`SELECT last_insert_rowid() as id`);
    const id = idResult[0].values[0][0];
    
    saveDatabase();
    
    // Now fetch the user
    const user = await this.getById(id);
    return user;
  }
  
  async update(id, data) {
    const db = await getDatabase();
    const fields = [];
    const values = [];
    
    if (data.role !== undefined) { fields.push('role = ?'); values.push(data.role); }
    if (data.is_active !== undefined) { fields.push('is_active = ?'); values.push(data.is_active ? 1 : 0); }
    if (data.password_hash !== undefined) { fields.push('password_hash = ?'); values.push(data.password_hash); }
    
    if (fields.length === 0) return await this.getById(id);
    
    values.push(id);
    const stmt = db.prepare(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`);
    stmt.run(values);
    stmt.free();
    
    saveDatabase();
    return await this.getById(id);
  }
  
  async delete(id) {
    const db = await getDatabase();
    const stmt = db.prepare(`DELETE FROM users WHERE id = ?`);
    stmt.run([id]);
    stmt.free();
    saveDatabase();
    return { changes: 1 };
  }
}

module.exports = new UserRepository();
