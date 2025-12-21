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
const gamificationRoutes = require('./routes/gamification');

const app = express();
// Enable trust proxy for Render/Heroku (required for secure cookies)
app.set('trust proxy', 1);
const PORT = process.env.PORT || 3000;

// Middleware
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:8080',
  'https://peppy-macaron-9b7729.netlify.app',
  process.env.CLIENT_URL
];

app.use(cors({
  origin: true,
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
app.use('/api/gamification', gamificationRoutes);

// Error handler
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err);
  res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Server is running',
    env: process.env.NODE_ENV,
    port: PORT,
    db: 'initialized'
  });
});

// Root API route
app.get('/api', (req, res) => {
  res.json({ message: 'VocabMaster API is running' });
});

// Serve static files from public directory (for Electron and production)
const fs = require('fs');
const publicPath = path.join(__dirname, '../public');

if (fs.existsSync(publicPath)) {
  app.use(express.static(publicPath));
  
  // Catch-all route to serve index.html for client-side routing
  app.get('*', (req, res) => {
    // Skip API routes
    if (req.path.startsWith('/api')) {
      return res.status(404).json({ error: 'API endpoint not found' });
    }
    res.sendFile(path.join(publicPath, 'index.html'));
  });
} else {
  console.log('Public directory not found, running in API-only mode');
  app.get('/', (req, res) => {
    res.json({ message: 'VocabMaster API is running' });
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
});

module.exports = app;
