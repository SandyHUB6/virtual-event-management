const { events } = require('../data/store');
const generateId = require('../utils/generateId');

// Date validation regex (YYYY-MM-DD)
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

// Time validation regex (24-hour format HH:mm)
const TIME_REGEX = /^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/;

/**
 * Helper to validate YYYY-MM-DD date format and validity
 */
function isValidDate(dateStr) {
  if (!DATE_REGEX.test(dateStr)) return false;
  const parsed = new Date(dateStr);
  return !isNaN(parsed.getTime());
}

/**
 * Helper to validate HH:mm time format
 */
function isValidTime(timeStr) {
  return TIME_REGEX.test(timeStr);
}

/**
 * Create a new event.
 * POST /events
 */
function createEvent(req, res) {
  try {
    const { title, date, time, description } = req.body;

    // 1. Validate required fields presence
    if (
      title === undefined ||
      date === undefined ||
      time === undefined ||
      description === undefined
    ) {
      return res.status(400).json({
        success: false,
        message: "Title, date, time and description are required"
      });
    }

    // Validate type of fields
    if (
      typeof title !== 'string' ||
      typeof date !== 'string' ||
      typeof time !== 'string' ||
      typeof description !== 'string'
    ) {
      return res.status(400).json({
        success: false,
        message: "Title, date, time and description must be strings"
      });
    }

    const trimmedTitle = title.trim();
    const trimmedDate = date.trim();
    const trimmedTime = time.trim();
    const trimmedDescription = description.trim();

    // Check for empty values
    if (!trimmedTitle || !trimmedDate || !trimmedTime || !trimmedDescription) {
      return res.status(400).json({
        success: false,
        message: "Title, date, time and description are required"
      });
    }

    // 2. Validate date format
    if (!isValidDate(trimmedDate)) {
      return res.status(400).json({
        success: false,
        message: "Invalid date format. Expected YYYY-MM-DD"
      });
    }

    // 3. Validate time format
    if (!isValidTime(trimmedTime)) {
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
      title: trimmedTitle,
      date: trimmedDate,
      time: trimmedTime,
      description: trimmedDescription,
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
      if (typeof title !== 'string' || !title.trim()) {
        return res.status(400).json({
          success: false,
          message: "Title cannot be empty"
        });
      }
    }

    if (description !== undefined) {
      if (typeof description !== 'string' || !description.trim()) {
        return res.status(400).json({
          success: false,
          message: "Description cannot be empty"
        });
      }
    }

    if (date !== undefined) {
      if (typeof date !== 'string' || !date.trim()) {
        return res.status(400).json({
          success: false,
          message: "Date cannot be empty"
        });
      }
      const trimmedDate = date.trim();
      if (!isValidDate(trimmedDate)) {
        return res.status(400).json({
          success: false,
          message: "Invalid date format. Expected YYYY-MM-DD"
        });
      }
    }

    if (time !== undefined) {
      if (typeof time !== 'string' || !time.trim()) {
        return res.status(400).json({
          success: false,
          message: "Time cannot be empty"
        });
      }
      const trimmedTime = time.trim();
      if (!isValidTime(trimmedTime)) {
        return res.status(400).json({
          success: false,
          message: "Invalid time format. Expected HH:mm (24-hour format)"
        });
      }
    }

    // 4. Update the fields
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

module.exports = {
  createEvent,
  getEvents,
  getEventById,
  updateEvent,
  deleteEvent
};
