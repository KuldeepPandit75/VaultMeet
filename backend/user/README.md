# API Documentation

## User Endpoints

### 1. Register User
#### POST /register

Register a new user in the system.

##### Request Body
```json
{
  "fullname": {
    "firstname": "John",
    "lastname": "Doe"
  },
  "email": "john.doe@example.com",
  "password": "password123",
  "role": "user"  // optional, defaults to "user"
}
```

##### Validation Rules
- **First Name**:
  - Required
  - Minimum length: 3 characters

- **Last Name**:
  - Required
  - Minimum length: 3 characters

- **Email**:
  - Required
  - Must be a valid email address
  - Must be unique

- **Password**:
  - Required
  - Minimum length: 8 characters

##### Status Codes
- `201 Created`: User successfully registered
- `400 Bad Request`: Validation errors
- `500 Internal Server Error`: Server-side errors

##### Example Response
Success Response (201):
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "fullname": {
      "firstname": "John",
      "lastname": "Doe"
    },
    "email": "john.doe@example.com",
    "role": "user",
    "_id": "user_id_here"
  }
}
```

### 2. Login User
#### POST /login

Authenticate a user and get access token.

##### Request Body
```json
{
  "email": "john.doe@example.com",
  "password": "password123"
}
```

##### Validation Rules
- **Email**:
  - Required
  - Must be a valid email address

- **Password**:
  - Required
  - Minimum length: 8 characters

##### Status Codes
- `200 OK`: Login successful
- `400 Bad Request`: Validation errors
- `401 Unauthorized`: Invalid credentials
- `500 Internal Server Error`: Server-side errors

##### Example Response
Success Response (200):
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "fullname": {
      "firstname": "John",
      "lastname": "Doe"
    },
    "email": "john.doe@example.com",
    "role": "user",
    "_id": "user_id_here"
  }
}
```

### 3. Get User Profile
#### GET /profile

Get the authenticated user's profile information.

##### Headers
- `Authorization`: Bearer token
- `Cookie`: token (if using cookie-based auth)

##### Status Codes
- `200 OK`: Profile retrieved successfully
- `401 Unauthorized`: Invalid or missing token
- `404 Not Found`: User not found
- `500 Internal Server Error`: Server-side errors

##### Example Response
Success Response (200):
```json
{
  "user": {
    "fullname": {
      "firstname": "John",
      "lastname": "Doe"
    },
    "email": "john.doe@example.com",
    "role": "user",
    "_id": "user_id_here"
  }
}
```

### 4. Logout User
#### POST /logout

Logout the current user and invalidate their token.

##### Headers
- `Authorization`: Bearer token
- `Cookie`: token (if using cookie-based auth)

##### Status Codes
- `200 OK`: Logout successful
- `401 Unauthorized`: Invalid or missing token
- `500 Internal Server Error`: Server-side errors

##### Example Response
Success Response (200):
```json
{
  "message": "Logged out successfully"
}
```

## Authentication Notes

- JWT tokens expire after 24 hours
- Tokens can be sent either in:
  - Authorization header: `Bearer <token>`
  - Cookie: `token=<token>`
- Logged out tokens are blacklisted for 24 hours
- Passwords are automatically hashed before storage
- User passwords are never included in responses 