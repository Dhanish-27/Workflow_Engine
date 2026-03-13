# Workflow Engine - Frontend

A React frontend for the Workflow Engine application with JWT authentication.

## Features

- User Registration
- User Login with JWT tokens
- Token refresh handling
- Protected routes
- Dashboard for authenticated users

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn

## Installation

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

The application will open at http://localhost:3000

## API Endpoints

The frontend connects to the Django backend at http://localhost:8000

- **Login**: POST `/api/token/` - Returns access and refresh tokens
- **Register**: POST `/api/accounts/register/` - Register new user
- **Refresh Token**: POST `/api/token/refresh/` - Refresh access token

## Project Structure

```
frontend/
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   └── PrivateRoute.js
│   ├── context/
│   │   └── AuthContext.js
│   ├── pages/
│   │   ├── Login.js
│   │   ├── Register.js
│   │   ├── Dashboard.js
│   │   ├── Auth.css
│   │   └── Dashboard.css
│   ├── services/
│   │   └── api.js
│   ├── App.js
│   ├── index.js
│   └── index.css
├── package.json
└── README.md
```

## User Roles

The application supports the following user roles:
- Employee
- Manager
- Finance
- CEO
- Admin
