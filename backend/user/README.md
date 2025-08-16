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
  "username": "johndoe",
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

- **Username**:
  - Required
  - Must be unique

##### Status Codes
- `201 Created`: User successfully registered
- `400 Bad Request`: Validation errors or username/email already exists
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
    "username": "johndoe",
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
    "username": "johndoe",
    "role": "user",
    "_id": "user_id_here"
  }
}
```

### 3. Get Current User
#### GET /me

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
    "username": "johndoe",
    "role": "user",
    "_id": "user_id_here"
  }
}
```

### 4. Get User Profile by ID
#### GET /profile/:profileId

Get a user's profile information by their ID.

##### Parameters
- `profileId`: The ID of the user to fetch

##### Status Codes
- `200 OK`: Profile retrieved successfully
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
    "username": "johndoe",
    "role": "user",
    "_id": "user_id_here"
  }
}
```

### 5. Logout User
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

### 6. Update User Profile
#### PUT /update

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
    "twitter": "https://twitter.com/johndoe"
  },
  "featuredProject": {
    "title": "VedicVerse",
    "description": "A 2D meta platform for vedas",
    "link": "vedicverse.vercel.app",
    "techUsed": ["react", "phaser.js"]
  },
  "achievements": [
    "SIH 2024 Winner",
    "VesHack 2025 Winner"
  ]
}
```

##### Validation Rules
- All fields are optional
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
      "twitter": "https://twitter.com/johndoe"
    },
    "featuredProject": {
      "title": "VedicVerse",
      "description": "A 2D meta platform for vedas",
      "link": "vedicverse.vercel.app",
      "techUsed": ["react", "phaser.js"]
    },
    "achievements": [
      "SIH 2024 Winner",
      "VesHack 2025 Winner"
    ],
    "_id": "user_id_here"
  }
}
```

### 7. Check Username Availability
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

### 8. Update Banner
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

### 9. Update Profile Picture
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

### 10. Google Login
#### POST /google-login

Authenticate a user using their Google account.

##### Request Body
```json
{
  "email": "john.doe@gmail.com",
  "name": "John Doe",
  "picture": "https://google-profile-picture-url.com",
  "googleId": "google-user-id"
}
```

##### Status Codes
- `200 OK`: Login successful
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
    "email": "john.doe@gmail.com",
    "username": "johndoe123",
    "role": "user",
    "avatar": "https://google-profile-picture-url.com",
    "googleId": "google-user-id",
    "_id": "user_id_here"
  }
}
```

### 11. Send OTP
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

### 12. Verify OTP
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

### 13. Reset Password
#### POST /reset-password

Reset user's password using verified OTP.

##### Request Body
```json
{
  "email": "john.doe@example.com",
  "otp": "123456",
  "newPassword": "newpassword123"
}
```

##### Validation Rules
- **Email**:
  - Required
  - Must be a valid email address
- **OTP**:
  - Required
  - Must be a valid 6-digit code
- **New Password**:
  - Required
  - Minimum length: 8 characters

##### Status Codes
- `200 OK`: Password reset successful
- `400 Bad Request`: Invalid input or validation errors
- `401 Unauthorized`: Invalid OTP
- `404 Not Found`: User not found
- `500 Internal Server Error`: Server-side errors

##### Example Response
Success Response (200):
```json
{
  "message": "Password reset successful"
}
```

## Authentication Notes

- JWT tokens expire after 7 days
- Tokens can be sent either in:
  - Authorization header: `Bearer <token>`
  - Cookie: `token=<token>`
- Logged out tokens are blacklisted
- Passwords are automatically hashed before storage
- User passwords are never included in responses
- OTP expires after 10 minutes
- Maximum 3 attempts allowed for OTP verification

## Event Endpoints

### 1. Get Published Events
#### GET /events/published

Get a paginated list of published events with optional filtering.

##### Query Parameters
- `page` (optional): Page number for pagination (default: 1)
- `limit` (optional): Number of events per page (default: 10)
- `startDate` (optional): Filter events starting from this date (format: YYYY-MM-DD)
- `endDate` (optional): Filter events until this date (format: YYYY-MM-DD)
- `mode` (optional): Filter by event mode (online/offline/hybrid)
- `type` (optional): Filter by event type

##### Status Codes
- `200 OK`: Events retrieved successfully
- `500 Internal Server Error`: Server-side errors

##### Example Response
Success Response (200):
```json
{
  "success": true,
  "data": {
    "events": [
      {
        "_id": "event_id_here",
        "company": {
          "name": "Tech Corp",
          "website": "https://techcorp.com",
          "industry": "Technology",
          "logo": "https://example.com/logo.png"
        },
        "name": "Tech Conference 2024",
        "type": "conference",
        "mode": "hybrid",
        "startDate": "2024-03-01T00:00:00.000Z",
        "endDate": "2024-03-02T00:00:00.000Z",
        "prizes": {
          "prizePool": "₹50,000"
        }
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalEvents": 50,
      "hasNextPage": true,
      "hasPreviousPage": false
    }
  }
}
```

### 2. Get Event by ID
#### GET /events/:eventId

Get detailed information about a specific event by its ID.

##### Parameters
- `eventId` (path parameter): The ID of the event to fetch

##### Status Codes
- `200 OK`: Event retrieved successfully
- `400 Bad Request`: Event ID is missing
- `404 Not Found`: Event not found
- `500 Internal Server Error`: Server-side errors

##### Example Response
Success Response (200):
```json
{
  "success": true,
  "data": {
    "_id": "event_id_here",
    "company": {
      "name": "Tech Corp",
      "website": "https://techcorp.com",
      "industry": "technology",
      "logo": "https://example.com/logo.png"
    },
    "contact": {
      "name": "John Doe",
      "email": "john@techcorp.com",
      "phone": "+1234567890",
      "socialProfiles": "https://linkedin.com/in/johndoe"
    },
    "name": "Tech Conference 2024",
    "banner": "https://example.com/banner.jpg",
    "type": "conference",
    "description": "Annual tech conference featuring the latest innovations...",
    "mode": "hybrid",
    "startDate": "2024-03-01T00:00:00.000Z",
    "endDate": "2024-03-02T00:00:00.000Z",
    "duration": "2 days",
    "targetAudience": "professionals",
    "maxParticipants": 500,
    "venue": {
      "name": "Convention Center",
      "address": "123 Tech Street",
      "city": "Tech City",
      "state": "Tech State",
      "country": "Tech Country",
      "contactPerson": "Jane Smith"
    },
    "stages": [
      {
        "stageName": "Registration",
        "stageDescription": "Team registration and verification",
        "stageStartDate": "2024-03-01T09:00:00.000Z",
        "stageEndDate": "2024-03-01T10:00:00.000Z",
        "onVaultMeet": true
      }
    ],
    "prizes": {
      "hasPrizes": true,
      "prizePool": "₹50,000",
      "prize1": "₹25,000",
      "prize2": "₹15,000",
      "prize3": "₹10,000",
      "details": "Cash prizes for top 3 teams"
    },
    "promotion": {
      "needsPromotion": true
    },
    "sponsors": [
      {
        "name": "Tech Sponsor",
        "logo": "https://example.com/sponsor-logo.png",
        "website": "https://techsponsor.com"
      }
    ],
    "status": "published",
    "stats": {
      "registeredParticipants": 200,
      "approvedParticipants": 150
    },
    "participantCount": 150,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-15T00:00:00.000Z"
  }
}
```

Error Response (404):
```json
{
  "success": false,
  "message": "Event not found"
}
``` 