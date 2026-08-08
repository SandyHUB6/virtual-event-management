const { users, events } = require('../src/data/store');
const generateId = require('../src/utils/generateId');

describe('Data Store & Utilities', () => {
  describe('In-Memory Data Store', () => {
    it('should export users array, initially empty', () => {
      expect(Array.isArray(users)).toBe(true);
      expect(users.length).toBe(0);
    });

    it('should export events array, initially empty', () => {
      expect(Array.isArray(events)).toBe(true);
      expect(events.length).toBe(0);
    });
  });

  describe('ID Generation Utility', () => {
    it('should generate a unique UUID v4 string', () => {
      const id1 = generateId();
      const id2 = generateId();
      
      expect(typeof id1).toBe('string');
      expect(id1).not.toBe(id2);
      
      // UUID v4 format regex
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[4][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      expect(id1).toMatch(uuidRegex);
    });
  });
});
