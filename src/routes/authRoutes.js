const express = require('express');
const { registerUser } = require('../controllers/authController');

const router = express.Router();

// Define route for user registration.
// Mounted at /register in app.js, resulting in POST /register
router.post('/', registerUser);

module.exports = router;
