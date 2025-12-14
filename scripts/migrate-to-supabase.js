/**
 * Migration script: reads local sql.js database and inserts rows into Supabase
 * Usage: set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in env, then run:
 * node scripts/migrate-to-supabase.js
 */
const { getDatabase } = require('../server/config/database');
const supabase = require('../server/lib/supabase');

function rowsFromResult(res) {
  if (!res || !res.length) return [];
  const cols = res[0].columns;
  return res[0].values.map(row => cols.reduce((obj, col, i) => { obj[col] = row[i]; return obj; }, {}));
}

async function migrateTable(tableName, transform = r => r) {
  const db = await getDatabase();
  const res = db.exec(`SELECT * FROM ${tableName}`);
  const rows = rowsFromResult(res).map(transform);
  if (!rows.length) return 0;
  // chunk inserts to avoid very large payloads
  const chunkSize = 200;
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    const { error } = await supabase.from(tableName).insert(chunk);
    if (error) {
      console.error(`Failed to insert chunk into ${tableName}:`, error);
      throw error;
    }
  }
  return rows.length;
}

async function run() {
  console.log('Starting migration to Supabase...');
  try {
    let count = 0;

    // users
    count += await migrateTable('users', r => ({ id: r.id, username: r.username, email: r.email, password_hash: r.password_hash, role: r.role, is_active: r.is_active ? true : false, created_at: r.created_at }));
    console.log('Migrated users');

    // vocabulary_sets
    count += await migrateTable('vocabulary_sets', r => ({ id: r.id, user_id: r.user_id, name: r.name, topic: r.topic, description: r.description, is_public: r.is_public ? true : false, is_locked: r.is_locked ? true : false, created_at: r.created_at }));
    console.log('Migrated vocabulary_sets');

    // words
    count += await migrateTable('words', r => ({ id: r.id, set_id: r.set_id, word: r.word, meaning: r.meaning, type: r.type, phonetic: r.phonetic, audio_path: r.audio_path, explain: r.explain, example: r.example, example_vietnamese: r.example_vietnamese, created_at: r.created_at }));
    console.log('Migrated words');

    // user_progress
    count += await migrateTable('user_progress', r => ({ id: r.id, user_id: r.user_id, word_id: r.word_id, remembered: r.remembered ? true : false, is_favorite: r.is_favorite ? true : false, review_count: r.review_count || 0, last_reviewed: r.last_reviewed, next_review: r.next_review, ease_factor: r.ease_factor || 2.5, interval_days: r.interval_days || 1 }));
    console.log('Migrated user_progress');

    // quiz_results
    count += await migrateTable('quiz_results', r => ({ id: r.id, user_id: r.user_id, set_id: r.set_id, quiz_type: r.quiz_type, score: r.score, total_questions: r.total_questions, time_taken: r.time_taken, created_at: r.created_at }));
    console.log('Migrated quiz_results');

    // admin tests
    count += await migrateTable('admin_tests', r => ({ id: r.id, title: r.title, description: r.description, source_set_id: r.source_set_id, word_count: r.word_count, created_by: r.created_by, created_at: r.created_at }));
    console.log('Migrated admin_tests');

    count += await migrateTable('admin_test_words', r => ({ id: r.id, test_id: r.test_id, word_id: r.word_id, word: r.word, meaning: r.meaning, phonetic: r.phonetic }));
    console.log('Migrated admin_test_words');

    count += await migrateTable('admin_test_assignments', r => ({ id: r.id, test_id: r.test_id, user_id: r.user_id, assigned_at: r.assigned_at, started_at: r.started_at, completed_at: r.completed_at, score: r.score, total_questions: r.total_questions }));
    console.log('Migrated admin_test_assignments');

    console.log('Migration completed. Total rows migrated (approx):', count);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

run();
