# virtual-event-management
A Complete Backend System for a Virtual Event Management Platform

## Data Storage
This application currently uses in-memory arrays for storing users and events. All data will reset whenever the server restarts.

## API Endpoints

### 1. User Registration
* **Endpoint**: `POST /register`
* **Purpose**: Register a new user as an organizer or attendee.
* **Request Body**:
  ```json
  {
    "name": "Sandy",
    "email": "sandy@example.com",
    "password": "password123",
    "role": "attendee"
  }
  ```
  * **Valid roles**: `organizer`, `attendee`
  * **Password requirements**: minimum 6 characters
* **Success Response**:
  * **Code**: `201 Created`
  * **Content**:
    ```json
    {
      "success": true,
      "message": "User registered successfully",
      "user": {
        "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
        "name": "Sandy",
        "email": "sandy@example.com",
        "role": "attendee",
        "createdAt": "2026-08-08T22:54:51.000Z"
      }
    }
    ```
* **Error Responses**:
  * **Code**: `400 Bad Request` (Missing required fields, invalid field types, empty values, invalid role, or password length < 6 characters)
  * **Code**: `409 Conflict` (User with this email already exists)

### 2. User Login
* **Endpoint**: `POST /login`
* **Purpose**: Authenticate a user and generate a JWT token.
* **Request Body**:
  ```json
  {
    "email": "sandy@example.com",
    "password": "password123"
  }
  ```
* **Success Response**:
  * **Code**: `200 OK`
  * **Content**:
    ```json
    {
      "success": true,
      "message": "Login successful",
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.payload.signature",
      "user": {
        "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
        "name": "Sandy",
        "email": "sandy@example.com",
        "role": "attendee"
      }
    }
    ```
* **Token Expiration**: The returned JWT token is valid for 1 hour (`expiresIn: "1h"`).
* **Error Responses**:
  * **Code**: `400 Bad Request` (Missing email or password fields, or invalid field types)
  * **Code**: `401 Unauthorized` (Invalid email or password — generic message for security)

## Authentication

Protected endpoints require JWT Authentication. The flow works as follows:
1. Register a user via `POST /register`.
2. Login via `POST /login` using registered credentials to receive a signed JWT token.
3. Attach this token to subsequent requests using the `Authorization` header:
   ```
   Authorization: Bearer <token>
   ```

### Protected Verification Route (Temporary)
* **Endpoint**: `GET /protected`
* **Purpose**: Verify authentication middleware setup. Requires a valid JWT token.
* **Headers**:
  * `Authorization: Bearer <token>`
* **Success Response**:
  * **Code**: `200 OK`
  * **Content**:
    ```json
    {
      "success": true,
      "message": "You have access to this protected route",
      "user": {
        "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
        "email": "sandy@example.com",
        "role": "attendee"
      }
    }
    ```
* **Error Responses**:
  * **Code**: `401 Unauthorized` (Authentication token is required / Invalid or expired authentication token)

## Role-Based Authorization

The application uses role-based authorization to restrict access to endpoints based on the authenticated user's role, extracted from the verified JWT (`req.user.role`).

### Roles Summary
* **Organizer**: 
  - Authorized to manage events.
  - Allowed to create, update, and delete events.
* **Attendee**: 
  - Authorized to register for and view events.
  - Not allowed to manage events (create, update, or delete).

### Role Verification Routes (Temporary)

#### 1. Organizer-Only Endpoint
* **Endpoint**: `GET /organizer-only`
* **Headers**:
  * `Authorization: Bearer <token>`
* **Success Response (Code 200)**:
  ```json
  {
    "success": true,
    "message": "Organizer access granted",
    "user": {
      "id": "organizer-uuid",
      "email": "organizer@example.com",
      "role": "organizer"
    }
  }
  ```
* **Error Response (Code 403)**:
  - If requested with an attendee token:
    ```json
    {
      "success": false,
      "message": "You are not authorized to access this resource"
    }
    ```

#### 2. Attendee-Only Endpoint
* **Endpoint**: `GET /attendee-only`
* **Headers**:
  * `Authorization: Bearer <token>`
* **Success Response (Code 200)**:
  ```json
  {
    "success": true,
    "message": "Attendee access granted",
    "user": {
      "id": "attendee-uuid",
      "email": "attendee@example.com",
      "role": "attendee"
    }
  }
  ```
* **Error Response (Code 403)**:
  - If requested with an organizer token:
    ```json
    {
      "success": false,
      "message": "You are not authorized to access this resource"
    }
    ```

## Event API Endpoints

### 1. Get All Events
* **Endpoint**: `GET /events`
* **Authentication**: None (Public)
* **Success Response (Code 200)**:
  ```json
  {
    "success": true,
    "count": 1,
    "events": [
      {
        "id": "e23b7ad9-2293-479e-af28-e1cb6f64d35c",
        "title": "Node.js Workshop",
        "date": "2026-08-20",
        "time": "18:00",
        "description": "Backend development workshop",
        "organizerId": "organizer-uuid",
        "participants": [],
        "createdAt": "2026-08-08T17:42:12.123Z",
        "updatedAt": "2026-08-08T17:42:12.123Z"
      }
    ]
  }
  ```

### 2. Get Event By ID
* **Endpoint**: `GET /events/:id`
* **Authentication**: None (Public)
* **Success Response (Code 200)**:
  ```json
  {
    "success": true,
    "event": {
      "id": "e23b7ad9-2293-479e-af28-e1cb6f64d35c",
      "title": "Node.js Workshop",
      "date": "2026-08-20",
      "time": "18:00",
      "description": "Backend development workshop",
      "organizerId": "organizer-uuid",
      "participants": [],
      "createdAt": "2026-08-08T17:42:12.123Z",
      "updatedAt": "2026-08-08T17:42:12.123Z"
    }
  }
  ```
* **Error Response (Code 404)**:
  ```json
  {
    "success": false,
    "message": "Event not found"
  }
  ```

### 3. Create Event
* **Endpoint**: `POST /events`
* **Authentication**: Required (JWT Bearer Token)
* **Role**: `organizer`
* **Request Body**:
  ```json
  {
    "title": "Node.js Workshop",
    "date": "2026-08-20",
    "time": "18:00",
    "description": "Backend development workshop"
  }
  ```
  * **date format**: `YYYY-MM-DD`
  * **time format**: `HH:mm` (24-hour format)
* **Success Response (Code 201)**:
  ```json
  {
    "success": true,
    "message": "Event created successfully",
    "event": {
      "id": "e23b7ad9-2293-479e-af28-e1cb6f64d35c",
      "title": "Node.js Workshop",
      "date": "2026-08-20",
      "time": "18:00",
      "description": "Backend development workshop",
      "organizerId": "organizer-uuid",
      "participants": [],
      "createdAt": "2026-08-08T17:42:12.123Z",
      "updatedAt": "2026-08-08T17:42:12.123Z"
    }
  }
  ```
* **Error Responses**:
  * **Code 400**: Missing required fields or invalid date/time format.
  * **Code 401**: Unauthorized.
  * **Code 403**: Forbidden (Attendee trying to create event).

### 4. Update Event
* **Endpoint**: `PUT /events/:id`
* **Authentication**: Required (JWT Bearer Token)
* **Role**: `organizer`
* **Ownership**: Organizers can only update events they created.
* **Request Body (Allows Partial Updates)**:
  ```json
  {
    "title": "Advanced Node.js Workshop",
    "time": "19:00"
  }
  ```
* **Success Response (Code 200)**:
  ```json
  {
    "success": true,
    "message": "Event updated successfully",
    "event": {
      "id": "e23b7ad9-2293-479e-af28-e1cb6f64d35c",
      "title": "Advanced Node.js Workshop",
      "date": "2026-08-20",
      "time": "19:00",
      "description": "Backend development workshop",
      "organizerId": "organizer-uuid",
      "participants": [],
      "createdAt": "2026-08-08T17:42:12.123Z",
      "updatedAt": "2026-08-08T17:45:00.000Z"
    }
  }
  ```
* **Error Responses**:
  * **Code 400**: Empty fields or invalid date/time update values.
  * **Code 401**: Unauthorized.
  * **Code 403**: Forbidden (Attendee trying to update, or Organizer who does not own the event).
    ```json
    {
      "success": false,
      "message": "You are not authorized to modify this event"
    }
    ```
  * **Code 404**: Event not found.

### 5. Delete Event
* **Endpoint**: `DELETE /events/:id`
* **Authentication**: Required (JWT Bearer Token)
* **Role**: `organizer`
* **Ownership**: Organizers can only delete events they created.
* **Success Response (Code 200)**:
  ```json
  {
    "success": true,
    "message": "Event deleted successfully"
  }
  ```
* **Error Responses**:
  * **Code 401**: Unauthorized.
  * **Code 403**: Forbidden (Attendee trying to delete, or Organizer who does not own the event).
  * **Code 404**: Event not found.

### 6. Register For Event
* **Endpoint**: `POST /events/:id/register`
* **Authentication**: Required (JWT Bearer Token)
* **Role**: `attendee`
* **Request Body**: None (The identity is derived from the verified JWT)
* **Success Response (Code 201)**:
  - **With email confirmation sent successfully**:
    ```json
    {
      "success": true,
      "message": "Successfully registered for the event",
      "registration": {
        "eventId": "event-uuid",
        "userId": "attendee-uuid"
      },
      "emailSent": true
    }
    ```
  - **With email confirmation failed or not configured**:
    ```json
    {
      "success": true,
      "message": "Successfully registered for the event, but confirmation email could not be sent",
      "registration": {
        "eventId": "event-uuid",
        "userId": "attendee-uuid"
      },
      "emailSent": false
    }
    ```
* **Error Responses**:
  * **Code 401**: Unauthorized.
  * **Code 403**: Forbidden (Organizer trying to register).
  * **Code 404**: Event not found.
  * **Code 409**: Conflict (Attendee is already registered for this event):
    ```json
    {
      "success": false,
      "message": "You are already registered for this event"
    }
    ```

### 7. Get My Registered Events
* **Endpoint**: `GET /my-events`
* **Authentication**: Required (JWT Bearer Token)
* **Role**: `attendee`
* **Success Response (Code 200)**:
  ```json
  {
    "success": true,
    "count": 1,
    "events": [
      {
        "id": "e23b7ad9-2293-479e-af28-e1cb6f64d35c",
        "title": "Node.js Workshop",
        "date": "2026-08-20",
        "time": "18:00",
        "description": "Backend development workshop",
        "organizerId": "organizer-uuid",
        "participants": ["attendee-uuid"],
        "createdAt": "2026-08-08T17:42:12.123Z",
        "updatedAt": "2026-08-08T17:42:12.123Z"
      }
    ]
  }
  ```
* **Error Responses**:
  * **Code 401**: Unauthorized.
  * **Code 403**: Forbidden (Only attendees can access).

### 8. Get Event Participants List
* **Endpoint**: `GET /events/:id/participants`
* **Authentication**: Required (JWT Bearer Token)
* **Role**: `organizer`
* **Ownership**: Organizers can only view the participant list of events they created.
* **Success Response (Code 200)**:
  ```json
  {
    "success": true,
    "eventId": "event-uuid",
    "count": 1,
    "participants": [
      {
        "id": "attendee-uuid",
        "name": "Attendee User",
        "email": "attendee@example.com",
        "role": "attendee"
      }
    ]
  }
  ```
* **Error Responses**:
  * **Code 401**: Unauthorized.
  * **Code 403**: Forbidden (Attendee trying to view participants, or Organizer who does not own the event):
    ```json
    {
      "success": false,
      "message": "You are not authorized to view participants for this event"
    }
    ```
  * **Code 404**: Event not found.

## Email Notifications

The application integrates with `nodemailer` to send asynchronous email notifications upon successful registration for events.

### SMTP Server Configuration
Define these SMTP configurations in your local environment `.env` file:
```env
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_USER=your_smtp_username
EMAIL_PASSWORD=your_smtp_password
EMAIL_FROM=no-reply@example.com
```

* **Graceful Failure Handling**: Registration remains successful even if the confirmation email delivery fails (due to incorrect credentials, socket timeouts, or missing configurations). The server logs the SMTP failure internally and returns `"emailSent": false` to the client.






