# Shapts Backend API

## Project Description

This is the backend API for the Shapts healthcare appointment system. It provides RESTful endpoints for user authentication, user management, appointment booking and management, and prescription management. The backend is built using Node.js, Express, and MongoDB.

## Features

- User registration, login, and logout with JWT authentication
- Role-based access control for patients, doctors, and admins
- CRUD operations for users (admin only)
- Appointment booking by patients with doctors
- Appointment status updates by doctors and admins
- Prescription creation, update, retrieval, and deletion by doctors and admins

## Prerequisites

- Node.js v16 or higher
- npm
- MongoDB Atlas or local MongoDB instance
- Docker (optional, for containerization)

## Installation and Setup

1. Clone the repository:

    git clone https://github.com/yourusername/shapts-backend.git
    cd shapts-backend

2. Install dependencies:

    npm install

3. Create a `.env` file based on the `.env.example` file:

    cp .env.example .env

4. Configure environment variables in `.env`:

    - `PORT`: Port number the server will listen on (default 5000)
    - `MONGODB_URI`: MongoDB connection string
    - `JWT_SECRET`: Secret key for signing JWT tokens
    - `NODE_ENV`: Set to `development` or `production`

5. Start the server:

    - For development with auto-reload:

        npm run dev

    - For production:

        npm start

## Running Tests

Tests are written using Jest and Supertest.

1. Make sure to configure a test MongoDB URI if different from production in `.env` (`MONGODB_URI_TEST`).

2. Run tests:

    npm test

## Docker Usage

### Build Docker Image

    docker build -t shapts-backend .

### Run Docker Container

    docker run -d -p 5000:5000 --env-file .env shapts-backend

## API Endpoints Summary

### Auth Routes (`/api/auth`)

- POST `/register`: Register new user
- POST `/login`: Login user
- POST `/logout`: Logout user

### User Routes (`/api/users`)

- GET `/profile`: Get logged-in user profile
- PUT `/profile`: Update logged-in user profile
- GET `/`: List all users (admin only)
- DELETE `/:id`: Delete user by ID (admin only)

### Appointment Routes (`/api/appointments`)

- POST `/`: Create new appointment (patient only)
- GET `/`: List appointments filtered by user role
- PUT `/:id/status`: Update appointment status (doctor/admin only)
- DELETE `/:id`: Cancel appointment (patient only)

### Prescription Routes (`/api/prescriptions`)

- POST `/`: Create prescription (doctor only)
- GET `/user/:userId`: Get prescriptions by patient user ID
- PUT `/:id`: Update prescription (doctor only)
- DELETE `/:id`: Delete prescription (doctor/admin only)

## Project Structure

