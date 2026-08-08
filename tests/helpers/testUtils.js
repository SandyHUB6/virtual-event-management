const { users, events } = require('../../src/data/store');

/**
 * Clean up the in-memory arrays to isolate test cases.
 * Clears the array contents without changing the exported reference.
 */
function clearStore() {
  users.length = 0;
  events.length = 0;
}

module.exports = {
  clearStore
};
