const express = require('express');
const cors = require('cors');
require('dotenv').config();

const ipLogger = require('./middleware/ipLogger');
const authRoutes = require('./routes/authRoutes');
const studentRoutes = require('./routes/studentRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(ipLogger);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/admin', adminRoutes);

// Root Health Check Route
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'University Online Voting API Server is running successfully (2026)',
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Global Server Error:', err.stack);
  res.status(500).json({
    success: false,
    message: 'Internal Server Error',
    error: err.message,
  });
});

// Start Server
app.listen(PORT, () => {
  console.log('=======================================================');
  console.log(`🚀 University Online Voting API Server running on port ${PORT}`);
  console.log('=======================================================');
});