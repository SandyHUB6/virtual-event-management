const express = require('express');
const dotenv = require('dotenv');
const authRoutes = require('./routes/authRoutes');
const eventRoutes = require('./routes/eventRoutes');
const { authenticateToken } = require('./middleware/authMiddleware');
const { authorizeRoles } = require('./middleware/roleMiddleware');

// Load environment variables from .env file
dotenv.config();

const app = express();

// Middleware to parse incoming JSON requests
app.use(express.json());

// Register API Routes
app.use('/', authRoutes);
app.use('/events', eventRoutes);

// Protected test endpoint (verification route)
app.get('/protected', authenticateToken, (req, res) => {
  res.status(200).json({
    success: true,
    message: "You have access to this protected route",
    user: req.user
  });
});

// Organizer-only verification route
app.get('/organizer-only', authenticateToken, authorizeRoles('organizer'), (req, res) => {
  res.status(200).json({
    success: true,
    message: "Organizer access granted",
    user: req.user
  });
});

// Attendee-only verification route
app.get('/attendee-only', authenticateToken, authorizeRoles('attendee'), (req, res) => {
  res.status(200).json({
    success: true,
    message: "Attendee access granted",
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
