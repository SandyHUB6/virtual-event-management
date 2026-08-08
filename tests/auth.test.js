const request = require('supertest');
const app = require('../src/app');
const { users } = require('../src/data/store');
const bcrypt = require('bcryptjs');

describe('POST /register', () => {
  beforeEach(() => {
    // Clear the in-memory users array before each test to ensure test isolation
    users.length = 0;
  });

  it('should successfully register a new user and return status 201', async () => {
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
    expect(res.body.message).toBe('User registered successfully');
    expect(res.body.user).toBeDefined();
    expect(res.body.user.id).toBeDefined();
    expect(res.body.user.name).toBe('Soundaryan');
    expect(res.body.user.email).toBe('sandy@example.com');
    expect(res.body.user.role).toBe('attendee');
    expect(res.body.user.createdAt).toBeDefined();
    
    // Ensure password / password hash is NOT returned
    expect(res.body.user.password).toBeUndefined();
    expect(res.body.password).toBeUndefined();

    // Verify stored user in memory
    expect(users.length).toBe(1);
    const storedUser = users[0];
    expect(storedUser.name).toBe('Soundaryan');
    expect(storedUser.email).toBe('sandy@example.com');
    expect(storedUser.role).toBe('attendee');
    
    // Verify password in memory is hashed
    expect(storedUser.password).not.toBe('password123');
    const isPasswordMatch = await bcrypt.compare('password123', storedUser.password);
    expect(isPasswordMatch).toBe(true);
  });

  it('should normalize email by trimming and converting to lowercase', async () => {
    const res = await request(app)
      .post('/register')
      .send({
        name: 'Test Normalization',
        email: '  NormalizeME@ExAmPlE.CoM  ',
        password: 'password123',
        role: 'organizer'
      });

    expect(res.statusCode).toEqual(201);
    expect(res.body.user.email).toBe('normalizeme@example.com');
    expect(users[0].email).toBe('normalizeme@example.com');
  });

  it('should return 409 when registering with a duplicate email', async () => {
    // Register first user
    await request(app)
      .post('/register')
      .send({
        name: 'Sandy 1',
        email: 'sandy@example.com',
        password: 'password123',
        role: 'attendee'
      });

    // Register second user with same email (checking case/whitespace normalization too)
    const res = await request(app)
      .post('/register')
      .send({
        name: 'Sandy 2',
        email: ' SANDY@example.com ',
        password: 'anotherpassword',
        role: 'organizer'
      });

    expect(res.statusCode).toEqual(409);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('User with this email already exists');
    expect(users.length).toBe(1);
  });

  it('should return 400 when role is invalid', async () => {
    const res = await request(app)
      .post('/register')
      .send({
        name: 'Invalid Role User',
        email: 'invalid@example.com',
        password: 'password123',
        role: 'admin'
      });

    expect(res.statusCode).toEqual(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Invalid role');
    expect(users.length).toBe(0);
  });

  it('should return 400 when required fields are missing', async () => {
    const res = await request(app)
      .post('/register')
      .send({
        name: 'Missing Email',
        password: 'password123',
        role: 'attendee'
      });

    expect(res.statusCode).toEqual(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Missing required fields');
    expect(users.length).toBe(0);
  });

  it('should return 400 when required fields contain only whitespace', async () => {
    const res = await request(app)
      .post('/register')
      .send({
        name: '   ',
        email: 'sandy@example.com',
        password: 'password123',
        role: 'attendee'
      });

    expect(res.statusCode).toEqual(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('cannot be empty');
    expect(users.length).toBe(0);
  });

  it('should return 400 when password is shorter than 6 characters', async () => {
    const res = await request(app)
      .post('/register')
      .send({
        name: 'Short Password User',
        email: 'short@example.com',
        password: '12345',
        role: 'attendee'
      });

    expect(res.statusCode).toEqual(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('at least 6 characters');
    expect(users.length).toBe(0);
  });
});

describe('POST /login', () => {
  beforeEach(async () => {
    // Clear users and seed a default user for testing login
    users.length = 0;
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

  it('should successfully log in with valid credentials and return status 200 with a token', async () => {
    const res = await request(app)
      .post('/login')
      .send({
        email: 'sandy@example.com',
        password: 'password123'
      });

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('Login successful');
    expect(res.body.token).toBeDefined();
    
    // Check JWT payload signature structure
    const tokenParts = res.body.token.split('.');
    expect(tokenParts.length).toBe(3);

    expect(res.body.user).toBeDefined();
    expect(res.body.user.id).toBe('user-uuid-123');
    expect(res.body.user.name).toBe('Sandy');
    expect(res.body.user.email).toBe('sandy@example.com');
    expect(res.body.user.role).toBe('attendee');
    expect(res.body.user.password).toBeUndefined();
  });

  it('should support case-insensitive email matching during login', async () => {
    const res = await request(app)
      .post('/login')
      .send({
        email: '  SANDY@ExAmPlE.CoM  ',
        password: 'password123'
      });

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user.email).toBe('sandy@example.com');
  });

  it('should return 401 when password is wrong', async () => {
    const res = await request(app)
      .post('/login')
      .send({
        email: 'sandy@example.com',
        password: 'wrongpassword'
      });

    expect(res.statusCode).toEqual(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Invalid email or password');
    expect(res.body.token).toBeUndefined();
  });

  it('should return 401 when email does not exist', async () => {
    const res = await request(app)
      .post('/login')
      .send({
        email: 'unknown@example.com',
        password: 'password123'
      });

    expect(res.statusCode).toEqual(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Invalid email or password');
    expect(res.body.token).toBeUndefined();
  });

  it('should return 400 when email or password is missing', async () => {
    const res = await request(app)
      .post('/login')
      .send({
        email: 'sandy@example.com'
        // password missing
      });

    expect(res.statusCode).toEqual(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Email and password are required');
  });

  it('should return 400 when email or password is empty string', async () => {
    const res = await request(app)
      .post('/login')
      .send({
        email: '   ',
        password: 'password123'
      });

    expect(res.statusCode).toEqual(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Email and password are required');
  });
});

