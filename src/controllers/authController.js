const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { users } = require('../data/store');
const generateId = require('../utils/generateId');

/**
 * Register a new user (organizer or attendee).
 * Mount endpoint: POST /register
 */
async function registerUser(req, res) {
  try {
    const { name, email, password, role } = req.body;

    // 1. Validate existence of required fields
    if (name === undefined || email === undefined || password === undefined || role === undefined) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields. name, email, password, and role are all required."
      });
    }

    // Validate type of fields
    if (
      typeof name !== 'string' ||
      typeof email !== 'string' ||
      typeof password !== 'string' ||
      typeof role !== 'string'
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid field types. All fields must be strings."
      });
    }

    const trimmedName = name.trim();
    const normalizedEmail = email.trim().toLowerCase();
    const trimmedRole = role.trim();

    // Check if empty values were passed
    if (!trimmedName || !normalizedEmail || !password || !trimmedRole) {
      return res.status(400).json({
        success: false,
        message: "Fields cannot be empty or contain only whitespace."
      });
    }

    // 2. Validate role
    const allowedRoles = ['organizer', 'attendee'];
    if (!allowedRoles.includes(trimmedRole)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role. Allowed roles are: organizer, attendee."
      });
    }

    // 3. Validate password length
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long."
      });
    }

    // 4. Check whether user with the same email already exists
    const emailExists = users.some(u => u.email === normalizedEmail);
    if (emailExists) {
      return res.status(409).json({
        success: false,
        message: "User with this email already exists"
      });
    }

    // 5. Hash the password using bcryptjs with salt rounds = 10
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 6. Generate ID and create User object
    const id = generateId();
    const createdAt = new Date().toISOString();

    const newUser = {
      id,
      name: trimmedName,
      email: normalizedEmail,
      password: hashedPassword,
      role: trimmedRole,
      createdAt
    };

    // 7. Store user in-memory
    users.push(newUser);

    // 8. Return response excluding password
    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        createdAt: newUser.createdAt
      }
    });
  } catch (error) {
    // Graceful error handling, avoiding stack traces and implementation exposure
    return res.status(500).json({
      success: false,
      message: "An error occurred while processing registration request."
    });
  }
}

/**
 * Authenticate a user and generate a JWT token.
 * Mount endpoint: POST /login
 */
async function loginUser(req, res) {
  try {
    const { email, password } = req.body;

    // 1. Validate existence of both fields
    if (email === undefined || password === undefined) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required"
      });
    }

    // Validate type of fields
    if (typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({
        success: false,
        message: "Email and password must be strings"
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check if empty values were passed
    if (!normalizedEmail || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required"
      });
    }

    // 2. Find user in-memory
    const user = users.find(u => u.email === normalizedEmail);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    // 3. Compare password with stored hash
    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    // 4. Verify JWT_SECRET is present
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error("JWT_SECRET environment variable is missing.");
      return res.status(500).json({
        success: false,
        message: "An error occurred while processing login request."
      });
    }

    // 5. Generate JWT token (expires in 1 hour)
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role
      },
      jwtSecret,
      { expiresIn: '1h' }
    );

    // 6. Return response
    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "An error occurred while processing login request."
    });
  }
}

module.exports = {
  registerUser,
  loginUser
};
