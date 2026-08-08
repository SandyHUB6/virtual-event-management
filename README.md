# Virtual Event Management API

A RESTful backend API for managing virtual events, user authentication, event registration, participant management, and registration email notifications. 

This project uses in-memory data structures for storing users and events instead of a database, making it lightweight and self-contained.

---

## Tech Stack

| Technology | Purpose |
| :--- | :--- |
| **Node.js** | Backend runtime environment |
| **Express.js** | Minimalist REST API framework |
| **bcryptjs** | Secure password hashing |
| **JSON Web Token (JWT)** | Stateless client authentication |
| **Nodemailer** | Event registration email notifications |
| **Jest** | Test runner and assertions framework |
| **Supertest** | HTTP assertion utility for API integration testing |
| **dotenv** | Environment variables configuration management |

---

## Features

* **User Registration & Hashing**: Attendees and organizers sign up with safe validation, with passwords securely salted and hashed via `bcryptjs`.
* **JWT-Based Authentication**: Stateless token generation on login with standard 1-hour expiration limits.
* **Role-Based Authorization**: Restricts API operations based on user roles (`organizer` and `attendee`).
* **Event CRUD Operations**: Organizers can manage events with strict validation checks on title, date format, and time.
* **Event Ownership Verification**: Organizers can only update or delete events that they created.
* **Attendee Event Registration**: Registered attendees can register for upcoming events.
* **Conflict Prevention**: Prevents double registrations by matching attendee IDs.
* **Participant Management**: Allows organizers to view safe details of participants registered for events they own.
* **Attendee Registered-Events View**: Attendees can query a listing of events they are currently registered to attend.
* **Email Notifications**: Automatically triggers registration confirmation emails asynchronously via `nodemailer`.
* **Centralized Validation**: Validates and normalizes emails, formats event dates (`YYYY-MM-DD`), and confirms 24-hour time ranges (`HH:mm`).
* **Robust Error Handling**: Express centralized error-handling and route not found (404) middlewares.
* **Automated API Test Suite**: Comprehensive testing with 69 assertions covering routing, inputs, authorization, and mocks.

---

## Project Structure

```
src/
├── controllers/            # Controller layers handling requests and business logic
│   ├── authController.js   # User registration and login handlers
│   └── eventController.js  # Event management, registration, and participant list handlers
├── middleware/             # Middlewares for auth, authorization, 404, and errors
│   ├── authMiddleware.js   # JWT authentication verification middleware
│   ├── roleMiddleware.js   # Role-based access control middleware
│   ├── errorMiddleware.js  # Centralized global error handling middleware
│   └── notFoundMiddleware.js # Route not found 404 fallback middleware
├── routes/                 # Express routing routes mapping
│   ├── authRoutes.js       # Authentication POST /register and POST /login endpoints
│   └── eventRoutes.js      # Event CRUD, registration, and participant endpoints
├── services/               # Internal business services
│   └── emailService.js     # Nodemailer SMTP transporter helper
├── data/                   # Data layer
│   └── store.js            # In-memory arrays for users and events storage
├── utils/                  # Helper utilities
│   ├── generateId.js       # Unique UUID generation utility
│   └── validation.js       # Centralized parameter validation functions
└── app.js                  # App config, routing registration, and middleware pipeline

tests/                      # Automated Test Suite
├── helpers/
│   └── testUtils.js        # Test helper managing store data resets
├── auth.test.js            # Signup, login, token auth, and role verification tests
├── events.test.js          # Event CRUD, validation, ownership, and partial update tests
├── registration.test.js    # Registration, email mocks, my-events, and participant list tests
├── health.test.js          # Health check and unmatched route handler tests
└── store.test.js           # Core in-memory data store tests

server.js                   # Node HTTP server entrypoint
package.json                # Project dependencies and test configurations
.env                        # Local environment credentials configuration
.env.example                # Template configuration for environment variables
.gitignore                  # Ignore patterns for untracked credentials files
README.md                   # Submission documentation handbook
```

---

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd virtual-event-management
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

---

## Environment Variables

Configure a `.env` file in the root directory by copying the structure of `.env.example`:

```env
PORT=5000
JWT_SECRET=your_super_secure_secret_key

EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_USER=your_smtp_username
EMAIL_PASSWORD=your_smtp_password
EMAIL_FROM=no-reply@example.com
```

> [!WARNING]
> Never commit the `.env` file to your source control. The `.gitignore` is already configured to exclude it.

---

## Running the Application

### Production Mode
To launch the application using standard Node:
```bash
npm start
```

### Development Mode
To launch the application using `nodemon` for auto-reloading:
```bash
npm run dev
```

The server will start running on the port defined (default: `5000`). You can verify if the service is running by requesting the health check:
```
GET http://localhost:5000/health
```
Response:
```json
{
  "success": true,
  "message": "Virtual Event Management API is running"
}
```

---

## Authentication & Authorization Flow

1. **Register**: Register an account as an `organizer` or `attendee` via `POST /register`.
2. **Login**: Login with credentials via `POST /login` to receive a signed JWT token containing the user's `id`, `email`, and `role`.
3. **Attach Header**: Secure routes require you to append this token in the `Authorization` request header:
   ```
   Authorization: Bearer <token>
   ```

### Roles Matrix

| Role | Permissions |
| :--- | :--- |
| **Organizer** | Create events, update/delete own events, and retrieve participants list of own events. Cannot register for events. |
| **Attendee** | Browse events, view registered events (`GET /my-events`), and register for upcoming events. Cannot create/update/delete events. |
| **Public** | List all events and query a single event by ID. |

---

## API Reference

### Verification Endpoints (Development Only)
* `GET /protected` - Verifies token verification middleware.
* `GET /organizer-only` - Verifies organizer authorization middleware.
* `GET /attendee-only` - Verifies attendee authorization middleware.

### Authentication Endpoints

#### User Registration
* **Endpoint**: `POST /register`
* **Access**: Public
* **Payload**:
  ```json
  {
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123",
    "role": "attendee"
  }
  ```
* **Success Status**: `201 Created`
* **Response**:
  ```json
  {
    "success": true,
    "message": "User registered successfully",
    "user": {
      "id": "74bcfc32-26c9-4ce6-a1cf-257325a92775",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "attendee",
      "createdAt": "2026-08-08T17:47:54.123Z"
    }
  }
  ```
* **Error Statuses**: 
  * `400 Bad Request` (Missing fields, invalid types, empty values, invalid role, password < 6 characters).
  * `409 Conflict` (Email already registered).

#### User Login
* **Endpoint**: `POST /login`
* **Access**: Public
* **Payload**:
  ```json
  {
    "email": "john@example.com",
    "password": "password123"
  }
  ```
* **Success Status**: `200 OK`
* **Response**:
  ```json
  {
    "success": true,
    "message": "Login successful",
    "token": "eyJhbGciOiJIUzI1NiJ9.payload.signature",
    "user": {
      "id": "74bcfc32-26c9-4ce6-a1cf-257325a92775",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "attendee"
    }
  }
  ```
* **Error Statuses**:
  * `400 Bad Request` (Missing fields).
  * `401 Unauthorized` (Invalid email or password).

---

### Events Endpoints

#### Create Event
* **Endpoint**: `POST /events`
* **Access**: Protected (Organizer Only)
* **Payload**:
  ```json
  {
    "title": "Node.js Workshop",
    "date": "2026-08-20",
    "time": "18:00",
    "description": "Backend development workshop"
  }
  ```
* **Success Status**: `201 Created`
* **Response**:
  ```json
  {
    "success": true,
    "message": "Event created successfully",
    "event": {
      "id": "54075cd6-b49f-4e4e-a87a-9426e81bea4c",
      "title": "Node.js Workshop",
      "date": "2026-08-20",
      "time": "18:00",
      "description": "Backend development workshop",
      "organizerId": "org-uuid-123",
      "participants": [],
      "createdAt": "2026-08-08T17:47:54.123Z",
      "updatedAt": "2026-08-08T17:47:54.123Z"
    }
  }
  ```
* **Error Statuses**:
  * `400 Bad Request` (Missing fields, invalid date calendar/format, or invalid 24-hr time).
  * `401 Unauthorized` (Invalid/missing token).
  * `403 Forbidden` (User is an attendee).

#### List All Events
* **Endpoint**: `GET /events`
* **Access**: Public
* **Success Status**: `200 OK`
* **Response**:
  ```json
  {
    "success": true,
    "count": 1,
    "events": [
      {
        "id": "54075cd6-b49f-4e4e-a87a-9426e81bea4c",
        "title": "Node.js Workshop",
        "date": "2026-08-20",
        "time": "18:00",
        "description": "Backend development workshop",
        "organizerId": "org-uuid-123",
        "participants": [],
        "createdAt": "2026-08-08T17:47:54.123Z",
        "updatedAt": "2026-08-08T17:47:54.123Z"
      }
    ]
  }
  ```

#### Get Event by ID
* **Endpoint**: `GET /events/:id`
* **Access**: Public
* **Success Status**: `200 OK`
* **Response**:
  ```json
  {
    "success": true,
    "event": {
      "id": "54075cd6-b49f-4e4e-a87a-9426e81bea4c",
      "title": "Node.js Workshop",
      "date": "2026-08-20",
      "time": "18:00",
      "description": "Backend development workshop",
      "organizerId": "org-uuid-123",
      "participants": [],
      "createdAt": "2026-08-08T17:47:54.123Z",
      "updatedAt": "2026-08-08T17:47:54.123Z"
    }
  }
  ```
* **Error Statuses**:
  * `404 Not Found` (Event not found).

#### Update Event
* **Endpoint**: `PUT /events/:id`
* **Access**: Protected (Organizer Owner Only)
* **Payload (Allows partial updates)**:
  ```json
  {
    "title": "Advanced Node.js Workshop",
    "time": "19:00"
  }
  ```
* **Success Status**: `200 OK`
* **Response**:
  ```json
  {
    "success": true,
    "message": "Event updated successfully",
    "event": {
      "id": "54075cd6-b49f-4e4e-a87a-9426e81bea4c",
      "title": "Advanced Node.js Workshop",
      "date": "2026-08-20",
      "time": "19:00",
      "description": "Backend development workshop",
      "organizerId": "org-uuid-123",
      "participants": [],
      "createdAt": "2026-08-08T17:47:54.123Z",
      "updatedAt": "2026-08-08T17:51:00.456Z"
    }
  }
  ```
* **Error Statuses**:
  * `400 Bad Request` (Empty update values, invalid date/time format).
  * `401 Unauthorized` (Invalid/missing token).
  * `403 Forbidden` (User is an attendee, or user does not own this event).
  * `404 Not Found` (Event not found).
  
  *Note: Client requests to modify read-only properties (`id`, `organizerId`, `participants`, `createdAt`, `updatedAt`) are silently ignored by the server, preserving data integrity.*

#### Delete Event
* **Endpoint**: `DELETE /events/:id`
* **Access**: Protected (Organizer Owner Only)
* **Success Status**: `200 OK`
* **Response**:
  ```json
  {
    "success": true,
    "message": "Event deleted successfully"
  }
  ```
* **Error Statuses**:
  * `401 Unauthorized` (Invalid/missing token).
  * `403 Forbidden` (User is an attendee, or user does not own this event).
  * `404 Not Found` (Event not found).

---

### Registration & Participant Endpoints

#### Register for Event
* **Endpoint**: `POST /events/:id/register`
* **Access**: Protected (Attendee Only)
* **Payload**: None
* **Success Status**: `201 Created`
* **Response (Email Confirmed)**:
  ```json
  {
    "success": true,
    "message": "Successfully registered for the event",
    "registration": {
      "eventId": "54075cd6-b49f-4e4e-a87a-9426e81bea4c",
      "userId": "74bcfc32-26c9-4ce6-a1cf-257325a92775"
    },
    "emailSent": true
  }
  ```
* **Response (Email Failed/Not Configured)**:
  ```json
  {
    "success": true,
    "message": "Successfully registered for the event, but confirmation email could not be sent",
    "registration": {
      "eventId": "54075cd6-b49f-4e4e-a87a-9426e81bea4c",
      "userId": "74bcfc32-26c9-4ce6-a1cf-257325a92775"
    },
    "emailSent": false
  }
  ```
* **Error Statuses**:
  * `401 Unauthorized` (Invalid/missing token).
  * `403 Forbidden` (User is an organizer).
  * `404 Not Found` (Event not found).
  * `409 Conflict` (Attendee already registered for this event).

#### View My Registered Events
* **Endpoint**: `GET /my-events`
* **Access**: Protected (Attendee Only)
* **Success Status**: `200 OK`
* **Response**:
  ```json
  {
    "success": true,
    "count": 1,
    "events": [
      {
        "id": "54075cd6-b49f-4e4e-a87a-9426e81bea4c",
        "title": "Node.js Workshop",
        "date": "2026-08-20",
        "time": "18:00",
        "description": "Backend development workshop",
        "organizerId": "org-uuid-123",
        "participants": ["74bcfc32-26c9-4ce6-a1cf-257325a92775"],
        "createdAt": "2026-08-08T17:47:54.123Z",
        "updatedAt": "2026-08-08T17:47:54.123Z"
      }
    ]
  }
  ```

#### View Event Participants
* **Endpoint**: `GET /events/:id/participants`
* **Access**: Protected (Organizer Owner Only)
* **Success Status**: `200 OK`
* **Response**:
  ```json
  {
    "success": true,
    "eventId": "54075cd6-b49f-4e4e-a87a-9426e81bea4c",
    "count": 1,
    "participants": [
      {
        "id": "74bcfc32-26c9-4ce6-a1cf-257325a92775",
        "name": "John Doe",
        "email": "john@example.com",
        "role": "attendee"
      }
    ]
  }
  ```
* **Error Statuses**:
  * `401 Unauthorized` (Invalid/missing token).
  * `403 Forbidden` (User is an attendee, or user is not the owner of this event).
  * `404 Not Found` (Event not found).

---

## Example API Requests

### 1. User Registration (Attendee)
```bash
curl -X POST http://localhost:5000/register \
-H "Content-Type: application/json" \
-d '{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "attendee"
}'
```

### 2. User Login
```bash
curl -X POST http://localhost:5000/login \
-H "Content-Type: application/json" \
-d '{
  "email": "john@example.com",
  "password": "password123"
}'
```

### 3. Create Event (Organizer)
```bash
curl -X POST http://localhost:5000/events \
-H "Content-Type: application/json" \
-H "Authorization: Bearer <TOKEN>" \
-d '{
  "title": "Node.js Workshop",
  "date": "2026-08-20",
  "time": "18:00",
  "description": "Backend development workshop"
}'
```

### 4. Register for Event (Attendee)
```bash
curl -X POST http://localhost:5000/events/<EVENT_ID>/register \
-H "Authorization: Bearer <ATTENDEE_TOKEN>"
```

---

## Authorization Matrix

| Operation | Public | Organizer | Attendee |
| :--- | :---: | :---: | :---: |
| Register | ✓ | ✓ | ✓ |
| Login | ✓ | ✓ | ✓ |
| View events | ✓ | ✓ | ✓ |
| Create event | ✗ | ✓ | ✗ |
| Update own event | ✗ | ✓ | ✗ |
| Delete own event | ✗ | ✓ | ✗ |
| Register for event | ✗ | ✗ | ✓ |
| View my events | ✗ | ✗ | ✓ |
| View participants | ✗ | Own events | ✗ |

---

## Validation & Business Rules

### Validation Criteria
* **Email Format & Normalization**: Must match `^[^\s@]+@[^\s@]+\.[^\s@]+$`. Stored and matched email addresses are trimmed of leading/trailing spaces and lowercased.
* **Password Strength**: Minimum length of **6 characters**.
* **Role Verification**: Must be exactly `organizer` or `attendee`.
* **Event Date Format**: Checked for standard `YYYY-MM-DD` syntax and validated against real Gregorian calendar dates (e.g. Feb 30th gets rejected with HTTP 400).
* **Event Time Format**: Must match 24-hour syntax `HH:mm` ranging from `00:00` to `23:59`.

### Write Protection Controls
Client requests to modify read-only properties are ignored by controllers to prevent tampering:
* **Users**: `id`, `password` (hashed values only), `createdAt` properties are set once at creation.
* **Events**: `id`, `organizerId` (always mapped to the token's authenticated organizer user), `participants` (only updated via `/register` routes), `createdAt` are read-only and ignored during partial event modifications.

---

## Consistent Error Responses

Every error returned by the server follows a strict payload format:
```json
{
  "success": false,
  "message": "Error details descriptive statement"
}
```

Standard status code mappings:
* **400 Bad Request**: Validation errors, empty fields, formatting issues.
* **401 Unauthorized**: Missing/expired authentication token or invalid credentials.
* **403 Forbidden**: Access restricted by role permissions or event ownership rules.
* **404 Not Found**: Non-existent API route paths or non-existent event IDs.
* **409 Conflict**: Duplicate conflicts (existing signup email or double registration).
* **500 Internal Server Error**: Unexpected server-side failures (masked to protect configurations).

---

## Email Confirmation & Failure Handling

* When an attendee successfully registers for an event (`POST /events/:id/register`), a confirmation email is dispatched asynchronously.
* Email sending uses the configurations provided in environment variables. If configurations are incomplete or SMTP server goes down, the event registration **remains successful** (attendee is added to the event), the error is logged to the server logs, and the API returns `"emailSent": false` to prevent blockages.
* Safe outputs guarantee that no internal transport credentials or stack traces are ever exposed in client payloads.

---

## Testing

The project uses `Jest` for unit/integration tests and `Supertest` to verify HTTP endpoints.

### Commands

* Run the complete test suite:
  ```bash
  npm run test
  ```
* Run test suite in watch mode:
  ```bash
  npm run test:watch
  ```

* **Test Isolation**: In-memory store data array lengths are truncated to 0 inside `beforeEach()` blocks, isolating assertions.
* **SMTP Mocking**: Mocking matches Jest spy patterns on the email transporter so that assertions run fast, reliably, and offline without actual SMTP server dependency.
* **Serverless HTTP**: Tests execute endpoints by passing the Express application instance directly to Supertest, preventing port conflicts.

### Automated Test Outcome
All 69 test specifications across 5 test suites are verified passing:
```
PASS tests/events.test.js
PASS tests/registration.test.js
PASS tests/auth.test.js
PASS tests/health.test.js
PASS tests/store.test.js

Test Suites: 5 passed, 5 total
Tests:       69 passed, 69 total
Snapshots:   0 total
Time:        19.167 s
```

---

## Project Limitations

This application utilizes **in-memory JavaScript arrays** for user and event storage as specified by the assignment rules:
* All state (registered users, created events, registrations) is lost when the node process stops or restarts.
* It is not intended for production usage in its current state.
* A production release would map this architecture to database persistent volumes (e.g. PostgreSQL or MongoDB) and queue engines (e.g. Redis).

---

## Assignment Requirements Checklist

* [x] Node.js + Express project initialized
* [x] In-memory data structures used
* [x] bcrypt password hashing
* [x] JWT authentication
* [x] Organizer/attendee roles
* [x] Event CRUD
* [x] Event registration
* [x] Participant management
* [x] Email notification
* [x] Async/await and Promises
* [x] RESTful endpoints
* [x] Automated tests (69 assertions passing)
* [x] README documentation

---

## Submission

* **Repository**: `<repository-url>`
* **Status**: Public / Ready for evaluation
