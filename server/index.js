const express = require('express');
const cors = require('cors');
const path = require('path');
const cookieParser = require('cookie-parser');
const { initDatabase } = require('./config/database');

// Import routes
const authRoutes = require('./routes/auth');
const setsRoutes = require('./routes/sets');
const wordsRoutes = require('./routes/words');
const progressRoutes = require('./routes/progress');
const quizRoutes = require('./routes/quiz');
const adminRoutes = require('./routes/admin');
const aiRoutes = require('./routes/ai');
const adminTestsRoutes = require('./routes/adminTests');

const app = express();
// Enable trust proxy for Render/Heroku (required for secure cookies)
app.set('trust proxy', 1);
const PORT = process.env.PORT || 3000;

// Middleware
// Middleware
const allowedOrigins = [
  'http://localhost:5173',
  'https://peppy-macaron-9b7729.netlify.app',
  process.env.CLIENT_URL
].filter(Boolean);

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('Blocked by CORS:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Initialize database
initDatabase();

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/sets', setsRoutes);
app.use('/api/words', wordsRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/admin-tests', adminTestsRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  const clientBuildPath = path.join(__dirname, '../client/dist');
  const fs = require('fs');
  
  if (fs.existsSync(clientBuildPath)) {
    app.use(express.static(clientBuildPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(clientBuildPath, 'index.html'));
    });
  } else {
    console.log('Client build not found, running in API-only mode');
    app.get('/', (req, res) => {
      res.json({ message: 'VocabMaster API is running' });
    });
  }
}

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

module.exports = app;
