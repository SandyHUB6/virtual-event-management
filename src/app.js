const express = require('express');
const dotenv = require('dotenv');
const authRoutes = require('./routes/authRoutes');
const { authenticateToken } = require('./middleware/authMiddleware');

// Load environment variables from .env file
dotenv.config();

const app = express();

// Middleware to parse incoming JSON requests
app.use(express.json());

// Register API Routes
app.use('/', authRoutes);

// Protected test endpoint (verification route)
app.get('/protected', authenticateToken, (req, res) => {
  res.status(200).json({
    success: true,
    message: "You have access to this protected route",
    user: req.user
  });
});

// Health Check Endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: "Virtual Event Management API is running"
  });
});

module.exports = app;
