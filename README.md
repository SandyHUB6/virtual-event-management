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
