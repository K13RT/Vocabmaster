const UserRepository = require('./sqlite/UserRepository');
const SetRepository = require('./sqlite/SetRepository');
const WordRepository = require('./sqlite/WordRepository');
const ProgressRepository = require('./sqlite/ProgressRepository');
const AdminRepository = require('./sqlite/AdminRepository');
const QuizRepository = require('./sqlite/QuizRepository');

module.exports = {
  UserRepository,
  SetRepository,
  WordRepository,
  ProgressRepository,
  AdminRepository,
  QuizRepository
};
