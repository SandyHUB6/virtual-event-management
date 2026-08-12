const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { users } = require('../data/store');
const generateId = require('../utils/generateId');
const { isNonEmptyString, isValidEmail } = require('../utils/validation');

/**
 * Register a new user (organizer or attendee).
 * Mount endpoint: POST /register
 */
async function registerUser(req, res) {
  try {
    const { name, email, password, role } = req.body;

    // 1. Validate required fields presence and types
    if (
      name === undefined ||
      email === undefined ||
      password === undefined ||
      role === undefined ||
      typeof name !== 'string' ||
      typeof email !== 'string' ||
      typeof password !== 'string' ||
      typeof role !== 'string'
    ) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields. All fields must be strings."
      });
    }

    // Validate empty/whitespace strings
    if (
      name.trim().length === 0 ||
      email.trim().length === 0 ||
      password.trim().length === 0 ||
      role.trim().length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Fields cannot be empty or contain only whitespace."
      });
    }

    const trimmedName = name.trim();
    const normalizedEmail = email.trim().toLowerCase();
    const trimmedRole = role.trim();

    // 2. Validate email format
    if (!isValidEmail(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address"
      });
    }

    // 3. Validate role
    if (trimmedRole !== 'organizer' && trimmedRole !== 'attendee') {
      return res.status(400).json({
        success: false,
        message: "Invalid role. Allowed roles are: organizer, attendee"
      });
    }

    // 4. Validate password length
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters"
      });
    }

    // 5. Check whether user with the same email already exists
    const emailExists = users.some(u => u.email === normalizedEmail);
    if (emailExists) {
      return res.status(409).json({
        success: false,
        message: "User with this email already exists"
      });
    }

    // 6. Hash the password using bcryptjs with salt rounds = 10
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 7. Generate ID and create User object
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

    // 8. Store user in-memory
    users.push(newUser);

    // 9. Return response excluding password
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
    if (!isNonEmptyString(email) || !isNonEmptyString(password)) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required"
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

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
