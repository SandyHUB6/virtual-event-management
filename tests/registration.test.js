const request = require('supertest');
const app = require('../src/app');
const { users, events } = require('../src/data/store');
const { clearStore } = require('./helpers/testUtils');
const bcrypt = require('bcryptjs');

// Mock the emailService
jest.mock('../src/services/emailService', () => ({
  sendRegistrationEmail: jest.fn().mockResolvedValue(true)
}));

const { sendRegistrationEmail } = require('../src/services/emailService');

describe('Event Registration and Participant Management Test Suite', () => {
  let organizerToken;
  let organizerId;
  let secondOrganizerToken;
  let secondOrganizerId;
  let attendeeAToken;
  let attendeeAId;
  let attendeeBToken;
  let attendeeBId;
  let testEventId;

  beforeEach(async () => {
    clearStore();
    sendRegistrationEmail.mockClear();
    sendRegistrationEmail.mockResolvedValue(true);

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);

    // Create Organizer
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

    // Create Second Organizer
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

    // Create Attendee A
    const attA = {
      id: 'att-uuid-a',
      name: 'Attendee A',
      email: 'att-a@example.com',
      password: hashedPassword,
      role: 'attendee',
      createdAt: new Date().toISOString()
    };
    users.push(attA);
    attendeeAId = attA.id;

    // Create Attendee B
    const attB = {
      id: 'att-uuid-b',
      name: 'Attendee B',
      email: 'att-b@example.com',
      password: hashedPassword,
      role: 'attendee',
      createdAt: new Date().toISOString()
    };
    users.push(attB);
    attendeeBId = attB.id;

    // Logins
    const login = async (email) => {
      const res = await request(app).post('/login').send({ email, password: 'password123' });
      return res.body.token;
    };

    organizerToken = await login('org-a@example.com');
    secondOrganizerToken = await login('org-b@example.com');
    attendeeAToken = await login('att-a@example.com');
    attendeeBToken = await login('att-b@example.com');

    // Create default event
    const event = {
      id: 'event-uuid-1',
      title: 'Node.js Workshop',
      date: '2026-08-20',
      time: '18:00',
      description: 'Backend workshop',
      organizerId: organizerId,
      participants: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    events.push(event);
    testEventId = event.id;
  });

  describe('Event Registration', () => {
    // 48. Attendee can register for an event
    it('48. should allow attendee to register for an event', async () => {
      const res = await request(app)
        .post(`/events/${testEventId}/register`)
        .set('Authorization', `Bearer ${attendeeAToken}`);

      expect(res.statusCode).toEqual(201);
      expect(res.body.success).toBe(true);
      expect(res.body.emailSent).toBe(true);
      expect(res.body.registration.eventId).toBe(testEventId);
      expect(res.body.registration.userId).toBe(attendeeAId);
      expect(events[0].participants).toContain(attendeeAId);
    });

    // 49. Verify email service is called
    it('49. should call email service with correct user and event details', async () => {
      await request(app)
        .post(`/events/${testEventId}/register`)
        .set('Authorization', `Bearer ${attendeeAToken}`);

      expect(sendRegistrationEmail).toHaveBeenCalledTimes(1);
      // Retrieve called arguments
      const calledArgs = sendRegistrationEmail.mock.calls[0];
      expect(calledArgs[0].id).toBe(attendeeAId);
      expect(calledArgs[0].email).toBe('att-a@example.com');
      expect(calledArgs[1].id).toBe(testEventId);
    });

    // 50. Duplicate registration is rejected
    it('50. should reject duplicate registration', async () => {
      await request(app)
        .post(`/events/${testEventId}/register`)
        .set('Authorization', `Bearer ${attendeeAToken}`);

      sendRegistrationEmail.mockClear();

      const res = await request(app)
        .post(`/events/${testEventId}/register`)
        .set('Authorization', `Bearer ${attendeeAToken}`);

      expect(res.statusCode).toEqual(409);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('already registered');
      expect(events[0].participants.length).toBe(1);
      expect(sendRegistrationEmail).not.toHaveBeenCalled();
    });

    // 51. Organizer cannot register using attendee endpoint
    it('51. should deny organizer from registering using attendee route', async () => {
      const res = await request(app)
        .post(`/events/${testEventId}/register`)
        .set('Authorization', `Bearer ${organizerToken}`);

      expect(res.statusCode).toEqual(403);
      expect(res.body.success).toBe(false);
      expect(events[0].participants.length).toBe(0);
    });

    // 52. Unauthenticated user cannot register
    it('52. should deny unauthenticated user from registering', async () => {
      const res = await request(app)
        .post(`/events/${testEventId}/register`);

      expect(res.statusCode).toEqual(401);
      expect(res.body.success).toBe(false);
      expect(events[0].participants.length).toBe(0);
    });

    // 53. Registration for unknown event returns 404
    it('53. should return 404 when registering for non-existent event', async () => {
      const res = await request(app)
        .post('/events/non-existent-event-id/register')
        .set('Authorization', `Bearer ${attendeeAToken}`);

      expect(res.statusCode).toEqual(404);
      expect(res.body.success).toBe(false);
    });

    // 54. Another attendee can register successfully
    it('54. should allow multiple attendees to register successfully', async () => {
      await request(app)
        .post(`/events/${testEventId}/register`)
        .set('Authorization', `Bearer ${attendeeAToken}`);

      const res = await request(app)
        .post(`/events/${testEventId}/register`)
        .set('Authorization', `Bearer ${attendeeBToken}`);

      expect(res.statusCode).toEqual(201);
      expect(events[0].participants).toContain(attendeeAId);
      expect(events[0].participants).toContain(attendeeBId);
      expect(events[0].participants.length).toBe(2);
    });
  });

  describe('Email Failure Handling', () => {
    // 55. Mock sendRegistrationEmail to reject
    it('55. should succeed registration even if email dispatch fails', async () => {
      sendRegistrationEmail.mockRejectedValue(new Error('SMTP connection error'));

      const res = await request(app)
        .post(`/events/${testEventId}/register`)
        .set('Authorization', `Bearer ${attendeeAToken}`);

      expect(res.statusCode).toEqual(201);
      expect(res.body.success).toBe(true);
      expect(res.body.emailSent).toBe(false);
      expect(res.body.message).toContain('confirmation email could not be sent');
      
      // Ensure participant was STILL added
      expect(events[0].participants).toContain(attendeeAId);
      
      // Ensure internal Nodemailer details are not leaked in body
      expect(res.body.message).not.toContain('SMTP');
    });
  });

  describe('My Events', () => {
    // 56. Attendee can call GET /my-events
    it('56. should retrieve events registered by the authenticated attendee', async () => {
      // Register Attendee A for event 1
      await request(app)
        .post(`/events/${testEventId}/register`)
        .set('Authorization', `Bearer ${attendeeAToken}`);

      // Seed another event Attendee A is NOT registered for
      events.push({
        id: 'event-uuid-2',
        title: 'Python Workshop',
        date: '2026-09-10',
        time: '19:00',
        description: 'AI workshop',
        organizerId: organizerId,
        participants: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      const res = await request(app)
        .get('/my-events')
        .set('Authorization', `Bearer ${attendeeAToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.count).toBe(1);
      expect(res.body.events[0].id).toBe(testEventId);
    });

    // 57. Attendee with no registrations receives empty list
    it('57. should return count 0 and empty array if no registered events', async () => {
      const res = await request(app)
        .get('/my-events')
        .set('Authorization', `Bearer ${attendeeAToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.count).toBe(0);
      expect(res.body.events).toEqual([]);
    });

    // 58. Organizer cannot access /my-events
    it('58. should deny organizer from accessing my-events endpoint', async () => {
      const res = await request(app)
        .get('/my-events')
        .set('Authorization', `Bearer ${organizerToken}`);

      expect(res.statusCode).toEqual(403);
      expect(res.body.success).toBe(false);
    });

    // 59. Unauthenticated user cannot access /my-events
    it('59. should deny unauthenticated user from accessing my-events endpoint', async () => {
      const res = await request(app).get('/my-events');

      expect(res.statusCode).toEqual(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('Participant List Visibility', () => {
    beforeEach(() => {
      // Add attendees to event participants list
      events[0].participants.push(attendeeAId, attendeeBId);
    });

    // 60. Event owner can view participants
    it('60. should allow event owner organizer to view registered participants details', async () => {
      const res = await request(app)
        .get(`/events/${testEventId}/participants`)
        .set('Authorization', `Bearer ${organizerToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.count).toBe(2);
      expect(res.body.participants.length).toBe(2);
      
      const p1 = res.body.participants.find(p => p.id === attendeeAId);
      expect(p1).toBeDefined();
      expect(p1.name).toBe('Attendee A');
      expect(p1.email).toBe('att-a@example.com');
      // Ensure password fields are not returned
      expect(p1.password).toBeUndefined();
      expect(p1.passwordHash).toBeUndefined();
    });

    // 61. Another organizer cannot view another organizer's participant list
    it('61. should deny another organizer from viewing the participant list', async () => {
      const res = await request(app)
        .get(`/events/${testEventId}/participants`)
        .set('Authorization', `Bearer ${secondOrganizerToken}`);

      expect(res.statusCode).toEqual(403);
      expect(res.body.success).toBe(false);
    });

    // 62. Attendee cannot access participant management endpoint
    it('62. should deny attendee from viewing the participant list', async () => {
      const res = await request(app)
        .get(`/events/${testEventId}/participants`)
        .set('Authorization', `Bearer ${attendeeAToken}`);

      expect(res.statusCode).toEqual(403);
      expect(res.body.success).toBe(false);
    });

    // 63. Unauthenticated user cannot access participant list
    it('63. should deny unauthenticated user from viewing participant list', async () => {
      const res = await request(app).get(`/events/${testEventId}/participants`);

      expect(res.statusCode).toEqual(401);
      expect(res.body.success).toBe(false);
    });

    // 64. Unknown event participant request returns 404
    it('64. should return 404 when querying participants for unknown event ID', async () => {
      const res = await request(app)
        .get('/events/unknown-event-id/participants')
        .set('Authorization', `Bearer ${organizerToken}`);

      expect(res.statusCode).toEqual(404);
      expect(res.body.success).toBe(false);
    });
  });
});
