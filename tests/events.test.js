const request = require('supertest');
const app = require('../src/app');
const { users, events } = require('../src/data/store');
const { clearStore } = require('./helpers/testUtils');
const bcrypt = require('bcryptjs');

describe('Event CRUD Test Suite', () => {
  let organizerToken;
  let organizerId;
  let secondOrganizerToken;
  let secondOrganizerId;
  let attendeeToken;
  let attendeeId;

  beforeEach(async () => {
    clearStore();

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);

    // Seed users
    const org = {
      id: 'org-uuid-1',
      name: 'Organizer A',
      email: 'org-a@example.com',
      password: hashedPassword,
      role: 'organizer',
      createdAt: new Date().toISOString()
    };
    users.push(org);
    organizerId = org.id;

    const secondOrg = {
      id: 'org-uuid-2',
      name: 'Organizer B',
      email: 'org-b@example.com',
      password: hashedPassword,
      role: 'organizer',
      createdAt: new Date().toISOString()
    };
    users.push(secondOrg);
    secondOrganizerId = secondOrg.id;

    const att = {
      id: 'att-uuid-1',
      name: 'Attendee A',
      email: 'att-a@example.com',
      password: hashedPassword,
      role: 'attendee',
      createdAt: new Date().toISOString()
    };
    users.push(att);
    attendeeId = att.id;

    // Login users to fetch tokens
    const login = async (email) => {
      const res = await request(app).post('/login').send({ email, password: 'password123' });
      return res.body.token;
    };

    organizerToken = await login('org-a@example.com');
    secondOrganizerToken = await login('org-b@example.com');
    attendeeToken = await login('att-a@example.com');
  });

  describe('Create Event', () => {
    // 27. Organizer can create an event
    it('27. should allow organizer to create an event', async () => {
      const res = await request(app)
        .post('/events')
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({
          title: 'Node.js Workshop',
          date: '2026-08-20',
          time: '18:00',
          description: 'Backend workshop'
        });

      expect(res.statusCode).toEqual(201);
      expect(res.body.success).toBe(true);
      expect(res.body.event).toBeDefined();
      expect(res.body.event.id).toBeDefined();
      expect(res.body.event.title).toBe('Node.js Workshop');
      expect(res.body.event.organizerId).toBe(organizerId);
      expect(res.body.event.participants).toEqual([]);
      expect(res.body.event.createdAt).toBeDefined();
      expect(res.body.event.updatedAt).toBeDefined();
      expect(events.length).toBe(1);
    });

    // 28. Attendee cannot create event
    it('28. should deny attendee from creating an event', async () => {
      const res = await request(app)
        .post('/events')
        .set('Authorization', `Bearer ${attendeeToken}`)
        .send({
          title: 'Attendee Workshop',
          date: '2026-08-20',
          time: '18:00',
          description: 'Denied'
        });

      expect(res.statusCode).toEqual(403);
      expect(res.body.success).toBe(false);
      expect(events.length).toBe(0);
    });

    // 29. Unauthenticated user cannot create event
    it('29. should deny unauthenticated user from creating an event', async () => {
      const res = await request(app)
        .post('/events')
        .send({
          title: 'Guest Workshop',
          date: '2026-08-20',
          time: '18:00',
          description: 'Denied'
        });

      expect(res.statusCode).toEqual(401);
      expect(res.body.success).toBe(false);
    });

    // 30. Reject event with missing required fields
    it('30. should reject event with missing fields', async () => {
      const res = await request(app)
        .post('/events')
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({
          title: 'Node.js Workshop',
          date: '2026-08-20'
          // time and description missing
        });

      expect(res.statusCode).toEqual(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('required');
    });

    // 31. Reject invalid event date
    it('31. should reject invalid event date format or calendar date', async () => {
      const res1 = await request(app)
        .post('/events')
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({
          title: 'Workshop',
          date: '2026-02-30', // Invalid calendar date
          time: '18:00',
          description: 'Desc'
        });
      expect(res1.statusCode).toEqual(400);

      const res2 = await request(app)
        .post('/events')
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({
          title: 'Workshop',
          date: 'invalid-date',
          time: '18:00',
          description: 'Desc'
        });
      expect(res2.statusCode).toEqual(400);
    });

    // 32. Reject invalid event time
    it('32. should reject invalid event time format', async () => {
      const res1 = await request(app)
        .post('/events')
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({
          title: 'Workshop',
          date: '2026-08-20',
          time: '25:00', // Invalid time
          description: 'Desc'
        });
      expect(res1.statusCode).toEqual(400);

      const res2 = await request(app)
        .post('/events')
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({
          title: 'Workshop',
          date: '2026-08-20',
          time: '9:00', // Missing leading zero
          description: 'Desc'
        });
      expect(res2.statusCode).toEqual(400);
    });

    // 33. Verify client cannot control organizerId
    it('33. should ignore client-provided organizerId during event creation', async () => {
      const res = await request(app)
        .post('/events')
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({
          title: 'Injected ID Event',
          date: '2026-08-20',
          time: '18:00',
          description: 'Injected ID',
          organizerId: 'injected-organizer-id'
        });

      expect(res.statusCode).toEqual(201);
      expect(res.body.event.organizerId).toBe(organizerId);
      expect(events[0].organizerId).toBe(organizerId);
    });
  });

  describe('Read Event', () => {
    let testEventId;
    beforeEach(() => {
      const created = {
        id: 'test-event-uuid-1',
        title: 'Node.js Workshop',
        date: '2026-08-20',
        time: '18:00',
        description: 'Initial',
        organizerId: organizerId,
        participants: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      events.push(created);
      testEventId = created.id;
    });

    // 34. Anyone can get all events
    it('34. should allow public access to list all events', async () => {
      const res = await request(app).get('/events');

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.count).toBe(1);
      expect(res.body.events[0].title).toBe('Node.js Workshop');
    });

    // 35. Anyone can get an event by ID
    it('35. should allow public access to view single event by ID', async () => {
      const res = await request(app).get(`/events/${testEventId}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.event.title).toBe('Node.js Workshop');
    });

    // 36. Unknown event returns 404
    it('36. should return 404 for unknown event ID', async () => {
      const res = await request(app).get('/events/invalid-event-id');

      expect(res.statusCode).toEqual(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe('Update Event', () => {
    let testEventId;
    beforeEach(() => {
      const created = {
        id: 'test-event-uuid-1',
        title: 'Node.js Workshop',
        date: '2026-08-20',
        time: '18:00',
        description: 'Initial description',
        organizerId: organizerId,
        participants: ['initial-attendee-id'],
        createdAt: '2026-08-08T00:00:00.000Z',
        updatedAt: '2026-08-08T00:00:00.000Z'
      };
      events.push(created);
      testEventId = created.id;
    });

    // 37. Event owner can update event
    it('37. should allow event owner organizer to update event details', async () => {
      const res = await request(app)
        .put(`/events/${testEventId}`)
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({
          title: 'Advanced Node.js',
          description: 'Updated description'
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.event.title).toBe('Advanced Node.js');
      expect(res.body.event.description).toBe('Updated description');
      expect(res.body.event.organizerId).toBe(organizerId);
      expect(res.body.event.participants).toEqual(['initial-attendee-id']);
    });

    // 38. Another organizer cannot update someone else's event
    it('38. should deny another organizer from updating the event', async () => {
      const res = await request(app)
        .put(`/events/${testEventId}`)
        .set('Authorization', `Bearer ${secondOrganizerToken}`)
        .send({
          title: 'Hack Attempt'
        });

      expect(res.statusCode).toEqual(403);
      expect(res.body.success).toBe(false);
      expect(events[0].title).toBe('Node.js Workshop');
    });

    // 39. Attendee cannot update event
    it('39. should deny attendee from updating the event', async () => {
      const res = await request(app)
        .put(`/events/${testEventId}`)
        .set('Authorization', `Bearer ${attendeeToken}`)
        .send({
          title: 'Hack Attempt'
        });

      expect(res.statusCode).toEqual(403);
      expect(res.body.success).toBe(false);
    });

    // 40. Unauthenticated user cannot update event
    it('40. should deny unauthenticated user from updating the event', async () => {
      const res = await request(app)
        .put(`/events/${testEventId}`)
        .send({
          title: 'Hack Attempt'
        });

      expect(res.statusCode).toEqual(401);
      expect(res.body.success).toBe(false);
    });

    // 41. Partial update works
    it('41. should support partial updates leaving other fields unchanged', async () => {
      const res = await request(app)
        .put(`/events/${testEventId}`)
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({
          title: 'Only Title Update'
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body.event.title).toBe('Only Title Update');
      expect(res.body.event.description).toBe('Initial description');
      expect(res.body.event.date).toBe('2026-08-20');
      expect(res.body.event.time).toBe('18:00');
    });

    // 42. Client cannot modify participants through PUT
    it('42. should safely ignore client attempts to modify event participants via PUT', async () => {
      const res = await request(app)
        .put(`/events/${testEventId}`)
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({
          participants: ['fake-user-id']
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body.event.participants).toEqual(['initial-attendee-id']);
      expect(events[0].participants).toEqual(['initial-attendee-id']);
    });

    // 43. Client cannot change organizerId through PUT
    it('43. should safely ignore client attempts to modify event organizerId via PUT', async () => {
      const res = await request(app)
        .put(`/events/${testEventId}`)
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({
          organizerId: secondOrganizerId
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body.event.organizerId).toBe(organizerId);
      expect(events[0].organizerId).toBe(organizerId);
    });
  });

  describe('Delete Event', () => {
    let testEventId;
    beforeEach(() => {
      const created = {
        id: 'test-event-uuid-1',
        title: 'Node.js Workshop',
        date: '2026-08-20',
        time: '18:00',
        description: 'Initial',
        organizerId: organizerId,
        participants: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      events.push(created);
      testEventId = created.id;
    });

    // 44. Event owner can delete event
    it('44. should allow event owner to delete event and return 404 subsequently', async () => {
      const delRes = await request(app)
        .delete(`/events/${testEventId}`)
        .set('Authorization', `Bearer ${organizerToken}`);

      expect(delRes.statusCode).toEqual(200);
      expect(delRes.body.success).toBe(true);
      expect(events.length).toBe(0);

      const getRes = await request(app).get(`/events/${testEventId}`);
      expect(getRes.statusCode).toEqual(404);
    });

    // 45. Another organizer cannot delete someone else's event
    it('45. should deny another organizer from deleting the event', async () => {
      const res = await request(app)
        .delete(`/events/${testEventId}`)
        .set('Authorization', `Bearer ${secondOrganizerToken}`);

      expect(res.statusCode).toEqual(403);
      expect(res.body.success).toBe(false);
      expect(events.length).toBe(1);
    });

    // 46. Attendee cannot delete event
    it('46. should deny attendee from deleting the event', async () => {
      const res = await request(app)
        .delete(`/events/${testEventId}`)
        .set('Authorization', `Bearer ${attendeeToken}`);

      expect(res.statusCode).toEqual(403);
      expect(res.body.success).toBe(false);
      expect(events.length).toBe(1);
    });

    // 47. Unknown event deletion returns 404
    it('47. should return 404 when deleting unknown event ID', async () => {
      const res = await request(app)
        .delete('/events/unknown-event-id')
        .set('Authorization', `Bearer ${organizerToken}`);

      expect(res.statusCode).toEqual(404);
      expect(res.body.success).toBe(false);
    });
  });
});
