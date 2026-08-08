const express = require('express');
const {
  createEvent,
  getEvents,
  getEventById,
  updateEvent,
  deleteEvent,
  registerForEvent,
  getEventParticipants
} = require('../controllers/eventController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

const router = express.Router();

// Public endpoints to view events
router.get('/', getEvents);
router.get('/:id', getEventById);

// Protected endpoints for event management (Organizer only)
router.post('/', authenticateToken, authorizeRoles('organizer'), createEvent);
router.put('/:id', authenticateToken, authorizeRoles('organizer'), updateEvent);
router.delete('/:id', authenticateToken, authorizeRoles('organizer'), deleteEvent);

// Protected endpoint for event registration (Attendee only)
router.post('/:id/register', authenticateToken, authorizeRoles('attendee'), registerForEvent);

// Protected endpoint to view event participants (Organizer only)
router.get('/:id/participants', authenticateToken, authorizeRoles('organizer'), getEventParticipants);

module.exports = router;
