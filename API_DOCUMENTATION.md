# Mitzvah Exchange Portal - API Documentation

## Overview
This document outlines all available API endpoints for the Mitzvah Exchange Portal MVP.

## Authentication
Most endpoints require JWT authentication. Include the token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

## API Endpoints

### Authentication

#### POST /api/auth/register
Register a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword",
  "displayName": "User Name",
  "bio": "Short bio about the user",
  "city": "City Name",
  "languages": ["English", "Hebrew"],
  "skills": ["Transportation", "Visits"],
  "privacy": {
    "showEmail": false,
    "showPhone": false,
    "showExactLocation": false
  }
}
```

**Response:**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "emailVerified": false
  },
  "token": "jwt-token"
}
```

#### POST /api/auth/login
Authenticate an existing user.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "role": "MEMBER"
  },
  "token": "jwt-token"
}
```

#### POST /api/auth/logout
Logout the current user (clears HTTP-only cookie).

**Response:**
```json
{
  "message": "Logged out successfully"
}
```

### User Profile

#### GET /api/users/me
Get current user's profile and statistics.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "role": "MEMBER",
    "emailVerified": true,
    "profile": {
      "displayName": "User Name",
      "bio": "User bio",
      "city": "City",
      "languages": ["English"],
      "skills": ["Transportation"],
      "privacy": {
        "showEmail": false,
        "showPhone": false,
        "showExactLocation": false
      }
    }
  },
  "stats": {
    "totalPoints": 50,
    "requestsPosted": 3,
    "requestsCompleted": 5,
    "averageRating": 4.8,
    "totalReviews": 10
  }
}
```

### Mitzvah Requests

#### GET /api/requests
Get all mitzvah requests with optional filtering.

**Query Parameters:**
- `category` (optional): Filter by category (VISITS, TRANSPORTATION, etc.)
- `urgency` (optional): Filter by urgency (LOW, NORMAL, HIGH)
- `status` (optional): Filter by status (OPEN, CLAIMED, CONFIRMED, EXPIRED)
- `city` (optional): Filter by city
- `limit` (optional): Number of results (default: 20)
- `offset` (optional): Pagination offset (default: 0)

**Response:**
```json
{
  "requests": [
    {
      "id": "request-id",
      "title": "Request Title",
      "description": "Detailed description",
      "category": "TRANSPORTATION",
      "urgency": "HIGH",
      "status": "OPEN",
      "locationDisplay": "Downtown",
      "timeWindowStart": "2024-01-15T10:00:00Z",
      "timeWindowEnd": "2024-01-15T14:00:00Z",
      "requirements": ["Must have car", "Available mornings"],
      "owner": {
        "profile": {
          "displayName": "Request Owner"
        }
      },
      "createdAt": "2024-01-10T08:00:00Z"
    }
  ],
  "total": 15,
  "hasMore": true
}
```

#### POST /api/requests
Create a new mitzvah request.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "title": "Need help with grocery shopping",
  "description": "Weekly grocery shopping assistance needed",
  "category": "ERRANDS",
  "urgency": "NORMAL",
  "locationDisplay": "Westside Market",
  "timeWindowStart": "2024-01-15T10:00:00Z",
  "timeWindowEnd": "2024-01-15T14:00:00Z",
  "requirements": ["Must have car", "Available weekends"],
  "attachments": []
}
```

**Response:**
```json
{
  "message": "Request created successfully",
  "request": {
    "id": "new-request-id",
    "title": "Need help with grocery shopping",
    "status": "OPEN",
    "createdAt": "2024-01-10T08:00:00Z"
  }
}
```

#### POST /api/requests/[id]/claim
Claim a mitzvah request.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "message": "Request claimed successfully",
  "assignment": {
    "id": "assignment-id",
    "status": "CLAIMED",
    "claimedAt": "2024-01-10T08:00:00Z"
  }
}
```

### Assignments

#### POST /api/assignments/[id]/complete
Mark an assignment as completed by the performer.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "notes": "Task completed successfully",
  "proofPhotos": ["photo1.jpg", "photo2.jpg"]
}
```

**Response:**
```json
{
  "message": "Assignment marked as completed",
  "assignment": {
    "id": "assignment-id",
    "status": "COMPLETED",
    "completedAt": "2024-01-10T15:00:00Z"
  }
}
```

#### POST /api/assignments/[id]/confirm
Confirm completion and award points (by request owner).

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "confirmed": true,
  "notes": "Great job, thank you!"
}
```

**Response:**
```json
{
  "message": "Assignment confirmed and points awarded",
  "assignment": {
    "id": "assignment-id",
    "status": "CONFIRMED",
    "confirmedAt": "2024-01-10T16:00:00Z"
  },
  "pointsAwarded": 15
}
```

## Error Responses

All endpoints may return these error responses:

**400 Bad Request:**
```json
{
  "error": "Invalid request data",
  "details": "Specific validation errors"
}
```

**401 Unauthorized:**
```json
{
  "error": "Authentication required"
}
```

**403 Forbidden:**
```json
{
  "error": "Insufficient permissions"
}
```

**404 Not Found:**
```json
{
  "error": "Resource not found"
}
```

**500 Internal Server Error:**
```json
{
  "error": "Internal server error"
}
```

## Data Models

### User Roles
- `MEMBER`: Regular community member
- `ADMIN`: Platform administrator
- `MODERATOR`: Community moderator

### Request Categories
- `VISITS`: Companionship and social visits
- `TRANSPORTATION`: Rides and transport assistance
- `ERRANDS`: Shopping, pickups, deliveries
- `TUTORING`: Educational support
- `MEALS`: Food preparation and delivery
- `HOUSEHOLD`: Cleaning, maintenance, organization
- `TECHNOLOGY`: Computer/device help
- `OTHER`: Miscellaneous community needs

### Request Urgency Levels
- `LOW`: Flexible timing, no rush
- `NORMAL`: Standard priority
- `HIGH`: Time-sensitive, important

### Request/Assignment Status
- `OPEN`: Available for claiming
- `CLAIMED`: Assigned to a performer
- `COMPLETED`: Marked complete by performer
- `CONFIRMED`: Confirmed by requester, points awarded
- `EXPIRED`: Past deadline, no longer active

## Authentication Flow

1. User registers via `/api/auth/register`
2. User logs in via `/api/auth/login` to get JWT token
3. Include JWT token in Authorization header for protected endpoints
4. Token expires after 7 days, user must re-authenticate

## Points System

Points are automatically calculated and awarded when assignments are confirmed:
- Base points vary by category (8-15 points)
- Urgency modifiers: HIGH (+5), NORMAL (+0), LOW (+0)
- Additional modifiers may apply based on request details

## Testing Data

The database has been seeded with test data:

**Admin Account:**
- Email: `admin@mitzvahexchange.com`
- Password: `admin123`

**Test User Accounts:**
- Sarah Miller: `sarah.miller@example.com` / `password123`
- David Cohen: `david.cohen@example.com` / `password123`
- Rachel Goldberg: `rachel.goldberg@example.com` / `password123`
- Michael Rosenberg: `michael.rosenberg@example.com` / `password123`

The seed data includes sample requests, assignments, and completed mitzvahs to test all workflows.
