# Campus Club Management System API

A RESTful API for managing campus clubs, events, and notices with role-based access control.

## Table of Contents
- [Overview](#overview)
- [Features](#features)
- [Installation](#installation)
- [API Documentation](#api-documentation)
  - [Authentication](#authentication)
  - [User Management](#user-management)
  - [Club Management](#club-management)
  - [Event Management](#event-management)
  - [Notice Management](#notice-management)
- [Testing with Postman](#testing-with-postman)
- [Workflow](#workflow)

## Overview

This API serves as the backend for a campus club management system where:
- Students can join clubs, register for events, and save notices
- Club coordinators can manage their club, request new events, and create notices
- Admins have full control over all aspects of the system

## Features

- Role-based access control (Student, Club Coordinator, Admin)
- JWT-based authentication
- Club membership management
- Event creation and approval workflow
- Notice creation and management
- User registration and profile management

## Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/campus-club-management.git
cd campus-club-management
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables (create a .env file)
```
PORT=8000
MONGODB_URI=mongodb+srv://your_mongodb_connection_string
CORS_ORIGIN=*
ACCESS_TOKEN_SECRET=your_access_token_secret
ACCESS_TOKEN_EXPIRY=1d
REFRESH_TOKEN_SECRET=your_refresh_token_secret
REFRESH_TOKEN_EXPIRY=10d
```

4. Start the server
```bash
# Development mode with nodemon
npm run dev

# Production mode
npm start
```

The API will be available at `http://localhost:8000`.

## API Documentation

### Authentication

#### Register a new user
- **URL**: `/api/users/register`
- **Method**: `POST`
- **Auth required**: No
- **Body**:
```json
{
  "name": "John Doe",
  "email": "john.doe@example.com",
  "password": "Password123",
  "clubAffiliation": "None"
}
```

#### Login
- **URL**: `/api/users/login`
- **Method**: `POST`
- **Auth required**: No
- **Body**:
```json
{
  "email": "john.doe@example.com",
  "password": "Password123"
}
```
- **Response**: Returns access token and refresh token

### User Management

#### Get user profile
- **URL**: `/api/users/profile/:email`
- **Method**: `GET`
- **Auth required**: Yes (JWT)

#### Update user
- **URL**: `/api/users/update/:email`
- **Method**: `PUT`
- **Auth required**: Yes (Admin only)
- **Body**:
```json
{
  "clubAffiliation": "Coding Club"
}
```

#### Change user role
- **URL**: `/api/admin/users/role`
- **Method**: `POST`
- **Auth required**: Yes (Admin only)
- **Body**:
```json
{
  "userId": "user_id_here",
  "role": "club-coordinator"
}
```

#### Get all users
- **URL**: `/api/admin/users`
- **Method**: `GET`
- **Auth required**: Yes (Admin only)

### Club Management

#### Create a club
- **URL**: `/api/admin/clubs/create`
- **Method**: `POST`
- **Auth required**: Yes (Admin only)
- **Body**:
```json
{
  "name": "Coding Club",
  "description": "A club for programming enthusiasts",
  "coordinatorEmail": "coordinator@example.com"
}
```

#### Get all clubs
- **URL**: `/api/clubs`
- **Method**: `GET`
- **Auth required**: No

#### Get coordinator's club
- **URL**: `/api/coordinator/clubs`
- **Method**: `GET`
- **Auth required**: Yes (Club Coordinator only)

#### Update club
- **URL**: `/api/coordinator/clubs/:clubId`
- **Method**: `PUT`
- **Auth required**: Yes (Club Coordinator only)
- **Body**:
```json
{
  "name": "Programming Club",
  "description": "Exploring the world of programming"
}
```

#### Request club membership
- **URL**: `/api/clubs/:clubId/request-membership`
- **Method**: `POST`
- **Auth required**: Yes

#### Get membership requests
- **URL**: `/api/coordinator/clubs/:clubId/membership-requests`
- **Method**: `GET`
- **Auth required**: Yes (Club Coordinator only)

#### Respond to membership request
- **URL**: `/api/coordinator/clubs/membership-response`
- **Method**: `POST`
- **Auth required**: Yes (Club Coordinator only)
- **Body**:
```json
{
  "clubId": "club_id_here",
  "requestId": "request_id_here",
  "status": "accepted"
}
```

#### Get user's club memberships
- **URL**: `/api/user/clubs`
- **Method**: `GET`
- **Auth required**: Yes

### Event Management

#### Submit event (Coordinator)
- **URL**: `/api/coordinator/events`
- **Method**: `POST`
- **Auth required**: Yes (Club Coordinator only)
- **Body**:
```json
{
  "name": "Coding Workshop",
  "description": "Learn the basics of web development",
  "date": "2023-12-15",
  "time": "10:00 AM",
  "location": "Computer Lab",
  "clubId": "club_id_here"
}
```

#### Submit event (Admin)
- **URL**: `/api/admin/events`
- **Method**: `POST`
- **Auth required**: Yes (Admin only)
- **Body**: Same as coordinator event submission

#### Update event
- **URL**: `/api/coordinator/events/:eventId`
- **Method**: `PUT`
- **Auth required**: Yes (Club Coordinator only)

#### Get all events
- **URL**: `/api/events`
- **Method**: `GET`
- **Auth required**: No

#### Get pending events
- **URL**: `/api/admin/events/pending`
- **Method**: `GET`
- **Auth required**: Yes (Admin only)

#### Approve/reject event
- **URL**: `/api/admin/events/approval`
- **Method**: `POST`
- **Auth required**: Yes (Admin only)
- **Body**:
```json
{
  "eventId": "event_id_here",
  "status": "approved",
  "rejectionReason": null
}
```

#### Register for event
- **URL**: `/api/events/:eventId/register`
- **Method**: `POST`
- **Auth required**: Yes

#### Bookmark event
- **URL**: `/api/events/:eventId/bookmark`
- **Method**: `POST`
- **Auth required**: Yes

#### Get user's events
- **URL**: `/api/user/events`
- **Method**: `GET`
- **Auth required**: Yes

### Notice Management

#### Submit notice (Coordinator)
- **URL**: `/api/coordinator/notices`
- **Method**: `POST`
- **Auth required**: Yes (Club Coordinator only)
- **Body**:
```json
{
  "title": "Workshop Announcement",
  "description": "Upcoming workshop on React.js",
  "category": "Workshop",
  "dueDate": "2023-12-10",
  "clubId": "club_id_here"
}
```

#### Post notice (Admin)
- **URL**: `/api/admin/notices`
- **Method**: `POST`
- **Auth required**: Yes (Admin only)
- **Body**: Same as coordinator notice submission

#### Update notice
- **URL**: `/api/coordinator/notices/:noticeId`
- **Method**: `PUT`
- **Auth required**: Yes (Club Coordinator only)

#### Delete notice
- **URL**: `/api/admin/notices/:noticeId`
- **Method**: `DELETE`
- **Auth required**: Yes (Admin only)

#### Get all notices
- **URL**: `/api/notices`
- **Method**: `GET`
- **Auth required**: No

#### Get pending notices
- **URL**: `/api/admin/notices/pending`
- **Method**: `GET`
- **Auth required**: Yes (Admin only)

#### Approve/reject notice
- **URL**: `/api/admin/notices/approval`
- **Method**: `POST`
- **Auth required**: Yes (Admin only)
- **Body**:
```json
{
  "noticeId": "notice_id_here",
  "status": "approved",
  "rejectionReason": null
}
```

#### Save notice
- **URL**: `/api/notices/:noticeId/save`
- **Method**: `POST`
- **Auth required**: Yes

#### Get user's saved notices
- **URL**: `/api/user/notices`
- **Method**: `GET`
- **Auth required**: Yes

## Testing with Postman

### Setting Up Postman

1. Create a new collection for "Campus Club Management"
2. Set up environment variables:
   - `baseUrl`: `http://localhost:8000/api`
   - `accessToken`: (will be filled after login)

### Testing Workflow

#### 1. Register Users

First, register three users with different roles:

**Student User:**
```json
{
  "name": "Student User",
  "email": "student@example.com",
  "password": "Student123",
  "clubAffiliation": "None"
}
```

**Coordinator User:**
```json
{
  "name": "Coordinator User",
  "email": "coordinator@example.com",
  "password": "Coord123",
  "clubAffiliation": "None"
}
```

**Admin User:**
```json
{
  "name": "Admin User",
  "email": "admin@example.com",
  "password": "Admin123",
  "clubAffiliation": "None"
}
```

#### 2. Login as Admin

```json
{
  "email": "admin@example.com",
  "password": "Admin123"
}
```

Save the returned access token to your Postman environment variable.

#### 3. Change User Roles

Change the coordinator's role (use the user ID from admin/users endpoint):

```json
{
  "userId": "coordinator_user_id",
  "role": "club-coordinator"
}
```

Change the admin's role (if not already set):

```json
{
  "userId": "admin_user_id",
  "role": "admin"
}
```

#### 4. Create Club

```json
{
  "name": "Coding Club",
  "description": "A club for programming enthusiasts",
  "coordinatorEmail": "coordinator@example.com"
}
```

#### 5. Login as Coordinator

```json
{
  "email": "coordinator@example.com",
  "password": "Coord123"
}
```

Save the returned access token.

#### 6. Submit Event as Coordinator

```json
{
  "name": "Introduction to Web Development",
  "description": "Learn HTML, CSS, and JavaScript basics",
  "date": "2023-12-15",
  "time": "2:00 PM",
  "location": "Computer Lab 101",
  "clubId": "club_id_from_previous_response"
}
```

#### 7. Login as Admin Again

Approve the event:

```json
{
  "eventId": "event_id_from_response",
  "status": "approved"
}
```

#### 8. Login as Student

```json
{
  "email": "student@example.com",
  "password": "Student123"
}
```

Save the returned access token.

#### 9. Register for Event

Use `POST /api/events/:eventId/register` endpoint.

#### 10. Request Club Membership

Use `POST /api/clubs/:clubId/request-membership` endpoint.

#### 11. Login as Coordinator Again

Accept membership request:

```json
{
  "clubId": "club_id",
  "requestId": "request_id_from_membership_requests",
  "status": "accepted"
}
```

## Workflow

1. Admin creates clubs and assigns coordinators
2. Coordinators submit events and notices for approval
3. Admin approves or rejects submissions
4. Students browse approved events and notices
5. Students request membership to clubs
6. Coordinators approve membership requests
7. Students register for events and save notices

---

This API provides a complete backend solution for campus club management, with appropriate role-based access control and approval workflows. 