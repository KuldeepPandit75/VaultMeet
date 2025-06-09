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

### 5. Update User Profile
#### PUT /profile

Update the authenticated user's profile information.

##### Headers
- `Authorization`: Bearer token
- `Cookie`: token (if using cookie-based auth)

##### Request Body
```json
{
  "fullname": {
    "firstname": "John",
    "lastname": "Doe"
  },
  "username": "johndoe",
  "bio": "Software Developer",
  "location": "New York",
  "college": "University of Technology",
  "skills": ["JavaScript", "Node.js", "React"],
  "interests": ["AI/ML", "Web Development"],
  "social": {
    "github": "https://github.com/johndoe",
    "linkedin": "https://linkedin.com/in/johndoe",
    "twitter": "https://twitter.com/johndoe",
  },
  "website": "https://portfolio.com/",
  "featuredProject": {
    "title": "VedicVerse",
    "description": "A 2D meta platform for vedas",
    "link": "vedicverse.vercel.app",
    "techUsed":["react","phaser.js"]
  },
  "achievements": [
    "SIH 2024 Winner",
    "VesHack 2025 Winner"
  ]
}
```

##### Validation Rules
- All fields are optional
- If password is provided, it must be at least 8 characters long
- Username must be unique if provided
- Email cannot be updated through this endpoint

##### Status Codes
- `200 OK`: Profile updated successfully
- `400 Bad Request`: Validation errors or duplicate username
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
    "username": "johndoe",
    "email": "john.doe@example.com",
    "bio": "Software Developer",
    "location": "New York",
    "college": "University of Technology",
    "skills": ["JavaScript", "Node.js", "React"],
    "interests": ["AI/ML", "Web Development"],
    "social": {
      "github": "https://github.com/johndoe",
      "linkedin": "https://linkedin.com/in/johndoe",
      "twitter": "https://twitter.com/johndoe",
      "instagram": "https://instagram.com/johndoe",
      "portfolio": "https://johndoe.com",
      "devpost": "https://devpost.com/johndoe"
    },
    "_id": "user_id_here"
  }
}
```

### 6. Check Username Availability
#### GET /check-username/:username

Check if a username is available for use.

##### Parameters
- `username`: The username to check (in URL)

##### Status Codes
- `200 OK`: Username availability check completed
- `400 Bad Request`: Username parameter missing
- `500 Internal Server Error`: Server-side errors

##### Example Response
Success Response (200):
```json
{
  "available": true,
  "message": "Username is available"
}
```

Or if username is taken:
```json
{
  "available": false,
  "message": "Username is already taken"
}
```

### 7. Update Banner
#### PUT /banner

Update the user's profile banner image.

##### Headers
- `Authorization`: Bearer token
- `Cookie`: token (if using cookie-based auth)

##### Request Body
- `banner`: Image file (multipart/form-data)
  - Supported formats: JPEG, JPG, PNG, GIF
  - Maximum size: 5MB

##### Status Codes
- `200 OK`: Banner updated successfully
- `400 Bad Request`: No file uploaded or invalid file type
- `401 Unauthorized`: Invalid or missing token
- `404 Not Found`: User not found
- `500 Internal Server Error`: Server-side errors

##### Example Response
Success Response (200):
```json
{
  "message": "Banner updated successfully",
  "banner": "https://res.cloudinary.com/your-cloud/image/upload/v1234567890/banners/example.jpg"
}
```

### 8. Update Profile Picture
#### PUT /avatar

Update the user's profile picture.

##### Headers
- `Authorization`: Bearer token
- `Cookie`: token (if using cookie-based auth)

##### Request Body
- `avatar`: Image file (multipart/form-data)
  - Supported formats: JPEG, JPG, PNG, GIF
  - Maximum size: 5MB

##### Status Codes
- `200 OK`: Profile picture updated successfully
- `400 Bad Request`: No file uploaded or invalid file type
- `401 Unauthorized`: Invalid or missing token
- `404 Not Found`: User not found
- `500 Internal Server Error`: Server-side errors

##### Example Response
Success Response (200):
```json
{
  "message": "Profile picture updated successfully",
  "avatar": "https://res.cloudinary.com/your-cloud/image/upload/v1234567890/avatars/example.jpg"
}
```

### 9. Send OTP
#### POST /send-otp

Send a one-time password to the user's email for verification.

##### Request Body
```json
{
  "email": "john.doe@example.com"
}
```

##### Validation Rules
- **Email**:
  - Required
  - Must be a valid email address
  - Must be registered in the system

##### Status Codes
- `200 OK`: OTP sent successfully
- `400 Bad Request`: Invalid email or validation errors
- `404 Not Found`: Email not registered
- `500 Internal Server Error`: Server-side errors

##### Example Response
Success Response (200):
```json
{
  "message": "OTP sent successfully"
}
```

### 10. Verify OTP
#### POST /verify-otp

Verify the OTP sent to the user's email.

##### Request Body
```json
{
  "email": "john.doe@example.com",
  "otp": "123456"
}
```

##### Validation Rules
- **Email**:
  - Required
  - Must be a valid email address
- **OTP**:
  - Required
  - Must be a valid 6-digit code

##### Status Codes
- `200 OK`: OTP verified successfully
- `400 Bad Request`: Invalid OTP or validation errors
- `401 Unauthorized`: OTP expired or invalid
- `500 Internal Server Error`: Server-side errors

##### Example Response
Success Response (200):
```json
{
  "result": "VERIFIED",
  "_id": "user_id_here",
  "role": "user"
}
```

Possible result values:
- `"VERIFIED"`: First time verification successful
- `"VALID"`: OTP is valid
- `"INVALID"`: OTP is incorrect
- `"EXHAUSTED"`: Maximum attempts reached

## Authentication Notes

- JWT tokens expire after 7 days
- Tokens can be sent either in:
  - Authorization header: `Bearer <token>`
  - Cookie: `token=<token>`
- Logged out tokens are blacklisted for 24 hours
- Passwords are automatically hashed before storage
- User passwords are never included in responses
- OTP expires after 10 minutes
- Maximum 3 attempts allowed for OTP verification 