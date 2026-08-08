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


