const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, '../data/vocabulary.db');
let db = null;
let SQL = null;

async function getDatabase() {
  if (db) return db;
  
  if (!SQL) {
    SQL = await initSqlJs();
  }
  
  // Load existing database or create new
  if (fs.existsSync(dbPath)) {
    const fileBuffer = fs.readFileSync(dbPath);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }
  
  return db;
}

function saveDatabase() {
  if (db) {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(dbPath, buffer);
  }
}

// Save database periodically and on exit
setInterval(saveDatabase, 30000); // Every 30 seconds
process.on('exit', saveDatabase);
process.on('SIGINT', () => { saveDatabase(); process.exit(); });
process.on('SIGTERM', () => { saveDatabase(); process.exit(); });

async function initDatabase() {
  const db = await getDatabase();
  
  // Users table
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT DEFAULT 'user',
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  // Vocabulary Sets table
  db.run(`
    CREATE TABLE IF NOT EXISTS vocabulary_sets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      topic TEXT,
      description TEXT,
      is_public INTEGER DEFAULT 0,
      is_locked INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);
  
  // Words table
  db.run(`
    CREATE TABLE IF NOT EXISTS words (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      set_id INTEGER NOT NULL,
      word TEXT NOT NULL,
      meaning TEXT NOT NULL,
      type TEXT,
      phonetic TEXT,
      audio_path TEXT,
      explain TEXT,
      example TEXT,
      example_vietnamese TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (set_id) REFERENCES vocabulary_sets(id) ON DELETE CASCADE
    )
  `);
  
  // Migration: Add new columns if they don't exist
  try {
    const columns = db.exec("PRAGMA table_info(words)")[0].values.map(col => col[1]);
    const setColumns = db.exec("PRAGMA table_info(vocabulary_sets)")[0].values.map(col => col[1]);
    
    if (!columns.includes('type')) {
      db.run("ALTER TABLE words ADD COLUMN type TEXT");
      console.log('✅ Added type column to words table');
    }
    if (!columns.includes('explain')) {
      db.run("ALTER TABLE words ADD COLUMN explain TEXT");
      console.log('✅ Added explain column to words table');
    }
    if (!columns.includes('example_vietnamese')) {
      db.run("ALTER TABLE words ADD COLUMN example_vietnamese TEXT");
      console.log('✅ Added example_vietnamese column to words table');
    }

    if (!setColumns.includes('is_locked')) {
      db.run("ALTER TABLE vocabulary_sets ADD COLUMN is_locked INTEGER DEFAULT 0");
      console.log('✅ Added is_locked column to vocabulary_sets table');
    }

    // Check user_progress table for is_favorite
    const progressColumns = db.exec("PRAGMA table_info(user_progress)")[0].values.map(col => col[1]);
    if (!progressColumns.includes('is_favorite')) {
      db.run("ALTER TABLE user_progress ADD COLUMN is_favorite INTEGER DEFAULT 0");
      console.log('✅ Added is_favorite column to user_progress table');
    }
  } catch (error) {
    console.error('Migration error:', error);
  }
  
  // User Progress table
  db.run(`
    CREATE TABLE IF NOT EXISTS user_progress (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      word_id INTEGER NOT NULL,
      remembered INTEGER DEFAULT 0,
      is_favorite INTEGER DEFAULT 0,
      review_count INTEGER DEFAULT 0,
      last_reviewed DATETIME,
      next_review DATETIME,
      ease_factor REAL DEFAULT 2.5,
      interval_days INTEGER DEFAULT 1,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (word_id) REFERENCES words(id) ON DELETE CASCADE,
      UNIQUE(user_id, word_id)
    )
  `);
  
  // Quiz Results table
  db.run(`
    CREATE TABLE IF NOT EXISTS quiz_results (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      set_id INTEGER NOT NULL,
      quiz_type TEXT NOT NULL,
      score INTEGER NOT NULL,
      total_questions INTEGER NOT NULL,
      time_taken INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (set_id) REFERENCES vocabulary_sets(id) ON DELETE CASCADE
    )
  `);
  
  // Admin Tests table
  db.run(`
    CREATE TABLE IF NOT EXISTS admin_tests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      source_set_id INTEGER,
      word_count INTEGER DEFAULT 10,
      created_by INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (source_set_id) REFERENCES vocabulary_sets(id) ON DELETE SET NULL,
      FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
    )
  `);
  
  // Admin Test Words table (for custom words or word references)
  db.run(`
    CREATE TABLE IF NOT EXISTS admin_test_words (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      test_id INTEGER NOT NULL,
      word_id INTEGER,
      word TEXT NOT NULL,
      meaning TEXT NOT NULL,
      phonetic TEXT,
      FOREIGN KEY (test_id) REFERENCES admin_tests(id) ON DELETE CASCADE,
      FOREIGN KEY (word_id) REFERENCES words(id) ON DELETE SET NULL
    )
  `);
  
  // Admin Test Assignments table
  db.run(`
    CREATE TABLE IF NOT EXISTS admin_test_assignments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      test_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      started_at DATETIME,
      completed_at DATETIME,
      score INTEGER,
      total_questions INTEGER,
      FOREIGN KEY (test_id) REFERENCES admin_tests(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(test_id, user_id)
    )
  `);
  
  // Create default admin user if not exists
  const adminExists = db.exec("SELECT id FROM users WHERE role = 'admin'");
  if (!adminExists.length || !adminExists[0].values.length) {
    const bcrypt = require('bcryptjs');
    const hashedPassword = bcrypt.hashSync(process.env.ADMIN_PASSWORD || 'admin123', 10);
    db.run(`INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)`,
      ['admin', 'admin@example.com', hashedPassword, 'admin']);
    console.log('✅ Default admin user created (admin / admin123)');
  }
  
  saveDatabase();
  console.log('✅ Database initialized successfully');
}

module.exports = { getDatabase, initDatabase, saveDatabase };
