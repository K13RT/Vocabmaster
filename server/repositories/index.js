// Repository exports - choose implementation based on USE_SUPABASE env
const useSupabase = process.env.USE_SUPABASE === 'true';

let UserRepository, SetRepository, WordRepository, ProgressRepository, AdminRepository;

if (useSupabase) {
  UserRepository = require('./supabase/UserRepository');
  SetRepository = require('./supabase/SetRepository');
  WordRepository = require('./supabase/WordRepository');
  ProgressRepository = require('./supabase/ProgressRepository');
  AdminRepository = require('./supabase/AdminRepository');
} else {
  UserRepository = require('./sqlite/UserRepository');
  SetRepository = require('./sqlite/SetRepository');
  WordRepository = require('./sqlite/WordRepository');
  ProgressRepository = require('./sqlite/ProgressRepository');
  AdminRepository = require('./sqlite/AdminRepository');
}

module.exports = {
  UserRepository,
  SetRepository,
  WordRepository,
  ProgressRepository,
  AdminRepository
};
