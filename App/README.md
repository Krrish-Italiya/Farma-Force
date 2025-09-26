# FarmaForce - User Login and Profile System

## Overview
This application provides a complete user authentication and profile management system with the following features:

- User registration with email verification
- Secure login with JWT authentication
- Profile management with image upload
- Real-time profile updates
- Responsive sidebar navigation

## Features

### Authentication
- **Login**: Secure login with email and password
- **Registration**: User signup with OTP verification
- **JWT Tokens**: Secure session management
- **Password Hashing**: Bcrypt encryption for passwords

### Profile Management
- **Profile View**: Display user information including:
  - Employee ID
  - Full Name
  - Email
  - Phone Number
  - Location
  - Profile Image
- **Profile Editing**: In-place editing of profile information
- **Image Upload**: Profile picture upload functionality
- **Real-time Updates**: Changes reflect immediately in the UI

### User Interface
- **Responsive Sidebar**: Navigation with user information
- **Protected Routes**: Authentication-required pages
- **Loading States**: Proper loading indicators
- **Error Handling**: User-friendly error messages

## Test User Credentials

For testing purposes, you can use the following credentials:

```
Email: shreyp693@gmail.com
Password: password123
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/signup` - User registration
- `POST /api/auth/verify-otp` - OTP verification
- `POST /api/auth/resend-otp` - Resend OTP

### User Profile
- `GET /api/user/profile` - Get user profile
- `PUT /api/user/update-profile` - Update profile information
- `PUT /api/user/update-profile-image` - Update profile image

### File Upload
- `POST /api/upload/image` - Upload profile image

## Data Flow

1. **Login Process**:
   - User enters email and password
   - Backend validates credentials
   - JWT token is generated and returned
   - User data is stored in AuthContext
   - User is redirected to dashboard

2. **Profile Data**:
   - Profile page uses data from AuthContext
   - Real-time updates sync with backend
   - Changes are immediately reflected in sidebar
   - Profile image uploads are handled securely

3. **Navigation**:
   - Sidebar displays current user information
   - Profile link navigates to profile page
   - Logout clears all user data

## Security Features

- JWT token-based authentication
- Password hashing with bcrypt
- Protected API routes
- Input validation and sanitization
- Secure file upload handling

## Getting Started

1. **Backend Setup**:
   ```bash
   cd App/backend
   npm install
   npm start
   ```

2. **Frontend Setup**:
   ```bash
   cd App/frontend
   npm install
   npm run dev
   ```

3. **Database Setup**:
   - Ensure MongoDB is running
   - Update `config.env` with your database URL
   - Run `node createTestUser.js` to create a test user

4. **Access the Application**:
   - Frontend: http://localhost:3000
   - Backend: http://localhost:5000

## File Structure

```
App/
├── backend/
│   ├── routes/
│   │   ├── auth.js          # Authentication routes
│   │   └── user.js          # User profile routes
│   ├── models/
│   │   └── User.js          # User data model
│   └── middleware/
│       └── auth.js          # JWT authentication middleware
└── frontend/
    ├── src/
    │   ├── contexts/
    │   │   └── AuthContext.tsx  # Authentication state management
    │   ├── components/
    │   │   └── Sidebar.tsx      # Navigation sidebar
    │   └── app/
    │       ├── auth/
    │       │   └── login/
    │       │       └── page.tsx # Login page
    │       └── profile/
    │           └── page.tsx     # Profile management page
```

## Technologies Used

- **Backend**: Node.js, Express.js, MongoDB, JWT
- **Frontend**: Next.js, TypeScript, Tailwind CSS
- **Authentication**: JWT tokens, bcrypt
- **File Upload**: Multer
- **Email**: Nodemailer for OTP delivery
