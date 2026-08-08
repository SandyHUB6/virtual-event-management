const request = require('supertest');
const app = require('../src/app');
const { users } = require('../src/data/store');
const { clearStore } = require('./helpers/testUtils');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

describe('Authentication Test Suite', () => {
  beforeEach(() => {
    clearStore();
  });

  describe('User Registration', () => {
    // 1. Successfully register an attendee
    it('1. should successfully register an attendee', async () => {
      const res = await request(app)
        .post('/register')
        .send({
          name: 'Soundaryan',
          email: 'sandy@example.com',
          password: 'password123',
          role: 'attendee'
        });

      expect(res.statusCode).toEqual(201);
      expect(res.body.success).toBe(true);
      expect(res.body.user).toBeDefined();
      expect(res.body.user.id).toBeDefined();
      expect(res.body.user.name).toBe('Soundaryan');
      expect(res.body.user.email).toBe('sandy@example.com');
      expect(res.body.user.role).toBe('attendee');
      // Verify password and hash are not returned
      expect(res.body.user.password).toBeUndefined();
      expect(res.body.password).toBeUndefined();
    });

    // 2. Successfully register an organizer
    it('2. should successfully register an organizer', async () => {
      const res = await request(app)
        .post('/register')
        .send({
          name: 'Organizer User',
          email: 'org@example.com',
          password: 'password123',
          role: 'organizer'
        });

      expect(res.statusCode).toEqual(201);
      expect(res.body.success).toBe(true);
      expect(res.body.user.role).toBe('organizer');
    });

    // 3. Reject missing name
    it('3. should reject missing name', async () => {
      const res = await request(app)
        .post('/register')
        .send({
          email: 'sandy@example.com',
          password: 'password123',
          role: 'attendee'
        });

      expect(res.statusCode).toEqual(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Missing required fields');
    });

    // 4. Reject missing email
    it('4. should reject missing email', async () => {
      const res = await request(app)
        .post('/register')
        .send({
          name: 'Soundaryan',
          password: 'password123',
          role: 'attendee'
        });

      expect(res.statusCode).toEqual(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Missing required fields');
    });

    // 5. Reject invalid email
    it('5. should reject invalid email', async () => {
      const invalidEmails = ['john', 'john@', '@example.com', '   '];
      for (const email of invalidEmails) {
        const res = await request(app)
          .post('/register')
          .send({
            name: 'Soundaryan',
            email,
            password: 'password123',
            role: 'attendee'
          });

        expect(res.statusCode).toEqual(400);
        expect(res.body.success).toBe(false);
      }
    });

    // 6. Reject missing password
    it('6. should reject missing password', async () => {
      const res = await request(app)
        .post('/register')
        .send({
          name: 'Soundaryan',
          email: 'sandy@example.com',
          role: 'attendee'
        });

      expect(res.statusCode).toEqual(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Missing required fields');
    });

    // 7. Reject password shorter than 6 characters
    it('7. should reject password shorter than 6 characters', async () => {
      const res = await request(app)
        .post('/register')
        .send({
          name: 'Soundaryan',
          email: 'sandy@example.com',
          password: '12345',
          role: 'attendee'
        });

      expect(res.statusCode).toEqual(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('at least 6 characters');
    });

    // 8. Reject invalid role
    it('8. should reject invalid role', async () => {
      const res = await request(app)
        .post('/register')
        .send({
          name: 'Soundaryan',
          email: 'sandy@example.com',
          password: 'password123',
          role: 'admin'
        });

      expect(res.statusCode).toEqual(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Invalid role');
    });

    // 9. Reject duplicate email
    it('9. should reject duplicate email', async () => {
      await request(app)
        .post('/register')
        .send({
          name: 'Attendee 1',
          email: 'sandy@example.com',
          password: 'password123',
          role: 'attendee'
        });

      const res = await request(app)
        .post('/register')
        .send({
          name: 'Attendee 2',
          email: 'sandy@example.com',
          password: 'password456',
          role: 'organizer'
        });

      expect(res.statusCode).toEqual(409);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('already exists');
    });

    // 10. Verify email normalization
    it('10. should verify email normalization', async () => {
      await request(app)
        .post('/register')
        .send({
          name: 'Soundaryan',
          email: 'TEST@Example.COM',
          password: 'password123',
          role: 'attendee'
        });

      expect(users.length).toBe(1);
      expect(users[0].email).toBe('test@example.com');
    });
  });

  describe('User Login', () => {
    beforeEach(async () => {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('password123', salt);
      users.push({
        id: 'user-uuid-123',
        name: 'Sandy',
        email: 'sandy@example.com',
        password: hashedPassword,
        role: 'attendee',
        createdAt: new Date().toISOString()
      });
    });

    // 11. Login successfully with valid credentials
    it('11. should login successfully with valid credentials', async () => {
      const res = await request(app)
        .post('/login')
        .send({
          email: 'sandy@example.com',
          password: 'password123'
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      expect(res.body.user).toBeDefined();
      expect(res.body.user.password).toBeUndefined();
    });

    // 12. Reject incorrect password
    it('12. should reject incorrect password', async () => {
      const res = await request(app)
        .post('/login')
        .send({
          email: 'sandy@example.com',
          password: 'wrongpassword'
        });

      expect(res.statusCode).toEqual(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Invalid email or password');
    });

    // 13. Reject unknown email
    it('13. should reject unknown email', async () => {
      const res = await request(app)
        .post('/login')
        .send({
          email: 'unknown@example.com',
          password: 'password123'
        });

      expect(res.statusCode).toEqual(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Invalid email or password');
    });

    // 14. Reject missing email
    it('14. should reject missing email', async () => {
      const res = await request(app)
        .post('/login')
        .send({
          password: 'password123'
        });

      expect(res.statusCode).toEqual(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('required');
    });

    // 15. Reject missing password
    it('15. should reject missing password', async () => {
      const res = await request(app)
        .post('/login')
        .send({
          email: 'sandy@example.com'
        });

      expect(res.statusCode).toEqual(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('required');
    });

    // 16. Verify JWT contains id, email, role (excluding password)
    it('16. should verify JWT payload attributes', async () => {
      const res = await request(app)
        .post('/login')
        .send({
          email: 'sandy@example.com',
          password: 'password123'
        });

      const token = res.body.token;
      const decoded = jwt.decode(token);

      expect(decoded.id).toBe('user-uuid-123');
      expect(decoded.email).toBe('sandy@example.com');
      expect(decoded.role).toBe('attendee');
      expect(decoded.password).toBeUndefined();
    });
  });

  describe('JWT Authentication Middleware', () => {
    let token;
    beforeEach(async () => {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('password123', salt);
      users.push({
        id: 'user-uuid-123',
        name: 'Sandy',
        email: 'sandy@example.com',
        password: hashedPassword,
        role: 'attendee',
        createdAt: new Date().toISOString()
      });

      const loginRes = await request(app)
        .post('/login')
        .send({
          email: 'sandy@example.com',
          password: 'password123'
        });
      token = loginRes.body.token;
    });

    // 17. Access protected endpoint using valid JWT
    it('17. should access protected endpoint with valid token', async () => {
      const res = await request(app)
        .get('/protected')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.user.email).toBe('sandy@example.com');
    });

    // 18. Reject protected endpoint without token
    it('18. should reject protected endpoint without token', async () => {
      const res = await request(app).get('/protected');

      expect(res.statusCode).toEqual(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('required');
    });

    // 19. Reject malformed Authorization header
    it('19. should reject malformed Authorization header', async () => {
      const res = await request(app)
        .get('/protected')
        .set('Authorization', 'InvalidTokenStructure');

      expect(res.statusCode).toEqual(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('required');
    });

    // 20. Reject invalid JWT
    it('20. should reject invalid JWT', async () => {
      const res = await request(app)
        .get('/protected')
        .set('Authorization', 'Bearer invalidtokenbody');

      expect(res.statusCode).toEqual(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Invalid or expired');
    });

    // 21. Reject tampered JWT
    it('21. should reject tampered JWT', async () => {
      const parts = token.split('.');
      // Tamper signature
      parts[2] = 'tamperedsig123';
      const tamperedToken = parts.join('.');

      const res = await request(app)
        .get('/protected')
        .set('Authorization', `Bearer ${tamperedToken}`);

      expect(res.statusCode).toEqual(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Invalid or expired');
    });
  });

  describe('Role Authorization', () => {
    let organizerToken;
    let attendeeToken;

    beforeEach(async () => {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('password123', salt);
      
      // Add organizer
      users.push({
        id: 'org-uuid',
        name: 'Organizer User',
        email: 'org@example.com',
        password: hashedPassword,
        role: 'organizer',
        createdAt: new Date().toISOString()
      });

      // Add attendee
      users.push({
        id: 'att-uuid',
        name: 'Attendee User',
        email: 'att@example.com',
        password: hashedPassword,
        role: 'attendee',
        createdAt: new Date().toISOString()
      });

      organizerToken = (await request(app).post('/login').send({ email: 'org@example.com', password: 'password123' })).body.token;
      attendeeToken = (await request(app).post('/login').send({ email: 'att@example.com', password: 'password123' })).body.token;
    });

    // 22. Organizer can access GET /organizer-only
    it('22. should allow organizer to access organizer-only route', async () => {
      const res = await request(app)
        .get('/organizer-only')
        .set('Authorization', `Bearer ${organizerToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
    });

    // 23. Attendee cannot access GET /organizer-only
    it('23. should deny attendee from accessing organizer-only route', async () => {
      const res = await request(app)
        .get('/organizer-only')
        .set('Authorization', `Bearer ${attendeeToken}`);

      expect(res.statusCode).toEqual(403);
      expect(res.body.success).toBe(false);
    });

    // 24. Attendee can access GET /attendee-only
    it('24. should allow attendee to access attendee-only route', async () => {
      const res = await request(app)
        .get('/attendee-only')
        .set('Authorization', `Bearer ${attendeeToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
    });

    // 25. Organizer cannot access GET /attendee-only
    it('25. should deny organizer from accessing attendee-only route', async () => {
      const res = await request(app)
        .get('/attendee-only')
        .set('Authorization', `Bearer ${organizerToken}`);

      expect(res.statusCode).toEqual(403);
      expect(res.body.success).toBe(false);
    });

    // 26. Unauthenticated receives 401 from both protected routes
    it('26. should deny unauthenticated access from role protected endpoints', async () => {
      const res1 = await request(app).get('/organizer-only');
      expect(res1.statusCode).toEqual(401);

      const res2 = await request(app).get('/attendee-only');
      expect(res2.statusCode).toEqual(401);
    });
  });
});
