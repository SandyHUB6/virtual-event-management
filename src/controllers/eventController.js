const { events, users } = require('../data/store');
const generateId = require('../utils/generateId');
const { sendRegistrationEmail } = require('../services/emailService');
const {
  isNonEmptyString,
  isValidDate,
  isValidTime
} = require('../utils/validation');

/**
 * Create a new event.
 * POST /events
 */
function createEvent(req, res) {
  try {
    const { title, date, time, description } = req.body;

    // 1. Validate required fields presence and types
    if (
      !isNonEmptyString(title) ||
      !isNonEmptyString(date) ||
      !isNonEmptyString(time) ||
      !isNonEmptyString(description)
    ) {
      return res.status(400).json({
        success: false,
        message: "Title, date, time and description are required"
      });
    }

    // 2. Validate date format and calendar validity
    if (!isValidDate(date)) {
      return res.status(400).json({
        success: false,
        message: "Invalid date format. Expected YYYY-MM-DD representing a real calendar date"
      });
    }

    // 3. Validate time format
    if (!isValidTime(time)) {
      return res.status(400).json({
        success: false,
        message: "Invalid time format. Expected HH:mm (24-hour format)"
      });
    }

    // 4. Create and push event object
    const id = generateId();
    const createdAt = new Date().toISOString();
    const updatedAt = createdAt;

    const newEvent = {
      id,
      title: title.trim(),
      date: date.trim(),
      time: time.trim(),
      description: description.trim(),
      organizerId: req.user.id, // Derived from JWT user context
      participants: [],
      createdAt,
      updatedAt
    };

    events.push(newEvent);

    return res.status(201).json({
      success: true,
      message: "Event created successfully",
      event: newEvent
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "An error occurred while creating the event."
    });
  }
}

/**
 * Get all events.
 * GET /events
 */
function getEvents(req, res) {
  try {
    return res.status(200).json({
      success: true,
      count: events.length,
      events
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "An error occurred while fetching events."
    });
  }
}

/**
 * Get a single event by ID.
 * GET /events/:id
 */
function getEventById(req, res) {
  try {
    const { id } = req.params;
    const event = events.find(e => e.id === id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found"
      });
    }

    return res.status(200).json({
      success: true,
      event
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "An error occurred while fetching the event."
    });
  }
}

/**
 * Update an event.
 * PUT /events/:id
 */
function updateEvent(req, res) {
  try {
    const { id } = req.params;
    const event = events.find(e => e.id === id);

    // 1. Check if event exists
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found"
      });
    }

    // 2. Verify ownership
    if (event.organizerId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to modify this event"
      });
    }

    const { title, date, time, description } = req.body;

    // 3. Validate inputs if provided for update
    if (title !== undefined) {
      if (!isNonEmptyString(title)) {
        return res.status(400).json({
          success: false,
          message: "Title cannot be empty"
        });
      }
    }

    if (description !== undefined) {
      if (!isNonEmptyString(description)) {
        return res.status(400).json({
          success: false,
          message: "Description cannot be empty"
        });
      }
    }

    if (date !== undefined) {
      if (!isValidDate(date)) {
        return res.status(400).json({
          success: false,
          message: "Invalid date format. Expected YYYY-MM-DD representing a real calendar date"
        });
      }
    }

    if (time !== undefined) {
      if (!isValidTime(time)) {
        return res.status(400).json({
          success: false,
          message: "Invalid time format. Expected HH:mm (24-hour format)"
        });
      }
    }

    // 4. Update allowed fields (forbidden fields such as id, organizerId, participants, createdAt, updatedAt are safely ignored)
    if (title !== undefined) event.title = title.trim();
    if (description !== undefined) event.description = description.trim();
    if (date !== undefined) event.date = date.trim();
    if (time !== undefined) event.time = time.trim();

    event.updatedAt = new Date().toISOString();

    return res.status(200).json({
      success: true,
      message: "Event updated successfully",
      event
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "An error occurred while updating the event."
    });
  }
}

/**
 * Delete an event.
 * DELETE /events/:id
 */
function deleteEvent(req, res) {
  try {
    const { id } = req.params;
    const eventIndex = events.findIndex(e => e.id === id);

    // 1. Check if event exists
    if (eventIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Event not found"
      });
    }

    const event = events[eventIndex];

    // 2. Verify ownership
    if (event.organizerId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to modify this event"
      });
    }

    // 3. Remove event from store
    events.splice(eventIndex, 1);

    return res.status(200).json({
      success: true,
      message: "Event deleted successfully"
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "An error occurred while deleting the event."
    });
  }
}

/**
 * Register the authenticated attendee user for an event.
 * POST /events/:id/register
 */
async function registerForEvent(req, res) {
  try {
    const { id } = req.params;

    // 1. Find the complete user details in the users store
    const user = users.find(u => u.id === req.user.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Authenticated user not found"
      });
    }

    const event = events.find(e => e.id === id);

    // 2. Check if event exists
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found"
      });
    }

    // 3. Check if attendee is already registered
    const isAlreadyRegistered = event.participants.includes(req.user.id);
    if (isAlreadyRegistered) {
      return res.status(409).json({
        success: false,
        message: "You are already registered for this event"
      });
    }

    // 4. Register user ID
    event.participants.push(req.user.id);

    // 5. Asynchronously attempt to send confirmation email
    let emailSent = false;
    try {
      await sendRegistrationEmail(user, event);
      emailSent = true;
    } catch (emailError) {
      // Log failure locally on the server; do not fail the request or revert participant list
      console.error(`SMTP Email dispatch failed for user ${user.email}:`, emailError.message);
      emailSent = false;
    }

    // 6. Return appropriate response
    if (emailSent) {
      return res.status(201).json({
        success: true,
        message: "Successfully registered for the event",
        registration: {
          eventId: event.id,
          userId: req.user.id
        },
        emailSent: true
      });
    } else {
      return res.status(201).json({
        success: true,
        message: "Successfully registered for the event, but confirmation email could not be sent",
        registration: {
          eventId: event.id,
          userId: req.user.id
        },
        emailSent: false
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "An error occurred while registering for the event."
    });
  }
}

/**
 * Get events registered by the authenticated attendee.
 * GET /my-events
 */
function getMyEvents(req, res) {
  try {
    const filteredEvents = events.filter(e => e.participants.includes(req.user.id));
    return res.status(200).json({
      success: true,
      count: filteredEvents.length,
      events: filteredEvents
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "An error occurred while retrieving registered events."
    });
  }
}

/**
 * Get safe participant list for an event.
 * GET /events/:id/participants
 */
function getEventParticipants(req, res) {
  try {
    const { id } = req.params;
    const event = events.find(e => e.id === id);

    // 1. Check if event exists
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found"
      });
    }

    // 2. Verify event ownership
    if (event.organizerId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to view participants for this event"
      });
    }

    // 3. Find participant users details (excluding password details)
    const participantsList = event.participants.map(userId => {
      const u = users.find(user => user.id === userId);
      return u ? {
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role
      } : null;
    }).filter(Boolean);

    return res.status(200).json({
      success: true,
      eventId: event.id,
      count: participantsList.length,
      participants: participantsList
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "An error occurred while retrieving event participants."
    });
  }
}

module.exports = {
  createEvent,
  getEvents,
  getEventById,
  updateEvent,
  deleteEvent,
  registerForEvent,
  getMyEvents,
  getEventParticipants
};
