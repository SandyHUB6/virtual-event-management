const crypto = require('crypto');

/**
 * Generates a unique UUID (v4).
 * @returns {string} The generated unique ID.
 */
function generateId() {
  return crypto.randomUUID();
}

module.exports = generateId;
