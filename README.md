# FarmaForce - Pharmaceutical Sales Management Platform

## Overview
FarmaForce is a comprehensive pharmaceutical sales management platform designed for medical representatives. The application provides:

- **Dashboard & Analytics**: KPI tracking, performance metrics, and trend analysis
- **Navigation & Scheduling**: Route planning, appointment management, and location tracking
- **AI-Powered Insights**: Smart recommendations and predictive analytics
- **Communication Hub**: Alerts, messaging, and report generation
- **User Management**: Secure authentication and profile management

## Key Features

### Dashboard & Analytics
- **KPI Dashboard**: Real-time performance metrics and targets
- **Trend Analysis**: Sales trends, product categories, and growth tracking
- **Performance Tracking**: Monthly, quarterly, and annual performance data
- **Report Generation**: Automated KPI reports via email and PDF download

### Navigation & Scheduling
- **Appointment Management**: Schedule and track doctor visits
- **Route Optimization**: Interactive maps with navigation support
- **Location Management**: Save and manage clinic accessibility locations
- **Calendar Integration**: Monthly view with appointment filtering

### AI-Powered Insights
- **Smart Recommendations**: AI-generated suggestions based on performance data
- **Predictive Analytics**: Future performance predictions and trends
- **Personalized Insights**: Tailored recommendations for sales optimization
- **Feedback System**: Like/dislike tracking for AI learning

### Communication & Alerts
- **Alert Management**: Create, update, and manage alerts
- **Communication History**: Track all interactions and messages
- **Notification System**: Real-time updates and reminders

### Authentication & Security
- **Secure Login**: JWT-based authentication
- **Profile Management**: User information and image uploads
- **OTP Verification**: Email-based account verification
- **Protected Routes**: Role-based access control

## Quick Start

### Test User Credentials
```
Email: shreyp693@gmail.com
Password: password123
```

### Environment Setup
1. **Backend**:
   ```bash
   cd backend
   npm install
   # Set up config.env with MongoDB_URL and JWT_SECRET
   npm run dev
   ```

2. **Frontend**:
   ```bash
   cd frontend
   npm install
   # Create .env.local with NEXT_PUBLIC_API_URL=http://localhost:5000
   npm run dev
   ```

3. **Access**:
   - Frontend: http://localhost:3000
   - Backend: http://localhost:5000

## API Documentation

For complete API documentation, see `API_ENDPOINTS.txt` in the project root.

### Key API Endpoints

#### Authentication & User Management
- `POST /api/auth/login` - User login
- `POST /api/auth/signup` - User registration
- `GET /api/user/profile` - Get user profile
- `PUT /api/user/update-notifications` - Update notification preferences

#### Analytics & Performance
- `GET /api/trends/performance` - Get performance data
- `GET /api/trends/product-categories` - Product category breakdown
- `POST /api/reports/kpi/email` - Send KPI report via email
- `GET /api/reports/kpi/download` - Download KPI report as PDF

#### AI & Insights
- `GET /api/insights` - Get AI insights and recommendations
- `POST /api/insights/kpi` - Generate insights from KPI data
- `POST /api/predictions/sync` - Synchronous AI predictions
- `POST /api/predictions/tasks` - Asynchronous AI tasks

#### Navigation & Scheduling
- `GET /api/schedule/appointments` - Get appointments
- `GET /api/navigation/locations` - Get saved locations

#### Communication & Feedback
- `GET /api/alerts` - Get alerts
- `POST /api/feedback` - Save user feedback (like/dislike)
- `GET /api/communication/history` - Get communication history

## Application Architecture

### Frontend (Next.js)
- **Pages**: Dashboard, KPI Dashboard, Navigation, AI Insights, Alerts, Communication
- **Components**: Sidebar, MobileBottomNav, ProtectedRoute
- **Services**: API service layer for backend communication
- **Context**: Authentication state management

### Backend (Node.js/Express)
- **Routes**: Authentication, user management, analytics, AI, navigation
- **Models**: User, Performance, SalesTrend, Feedback, Location
- **Services**: Email, Cloudinary, AI prediction interface
- **Middleware**: JWT authentication, error handling

## AI Integration

The platform includes a pluggable AI/ML interface for the AI team to integrate their prediction models:

- **Prediction Service**: `/backend/services/predictionService.js` - Replace with real AI models
- **Insights API**: `/api/insights` - Baseline heuristic recommendations
- **Feedback System**: User preferences stored for AI learning
- **API Contract**: Stable endpoints for AI team integration

## Security & Performance

### Security Features
- JWT token-based authentication
- Password hashing with bcrypt
- Protected API routes
- Input validation and sanitization
- Secure file upload handling

### Performance Optimizations
- Server-side rendering (SSR) with Next.js
- Image optimization and lazy loading
- Efficient API caching
- Responsive design for mobile and desktop

## Project Structure

```
App/
├── backend/
│   ├── routes/              # API route handlers
│   │   ├── auth.js          # Authentication
│   │   ├── user.js          # User management
│   │   ├── trends.js        # Analytics & performance
│   │   ├── insights.js      # AI insights
│   │   ├── predictions.js   # AI predictions
│   │   ├── feedback.js      # User feedback
│   │   ├── alerts.js        # Alert management
│   │   ├── communication.js # Communication
│   │   ├── schedule.js      # Appointment scheduling
│   │   └── navigation.js      # Navigation & locations
│   ├── models/              # Database models
│   │   ├── User.js          # User data
│   │   ├── Performance.js   # Performance metrics
│   │   ├── SalesTrend.js    # Sales trends
│   │   ├── Feedback.js      # User feedback
│   │   └── Location.js      # Saved locations
│   ├── services/            # Business logic
│   │   ├── emailService.js  # Email notifications
│   │   ├── cloudinaryService.js # File uploads
│   │   └── predictionService.js # AI interface
│   └── middleware/
│       └── auth.js          # JWT authentication
└── frontend/
    ├── src/
    │   ├── app/              # Next.js app router pages
    │   │   ├── dashboard/    # Main dashboard
    │   │   ├── kpi-dashboard/ # KPI analytics
    │   │   ├── navigation/   # Navigation & scheduling
    │   │   ├── ai-insights/  # AI recommendations
    │   │   ├── alerts/       # Alert management
    │   │   ├── communication/ # Communication hub
    │   │   └── auth/         # Authentication pages
    │   ├── components/       # Reusable components
    │   │   ├── Sidebar.tsx   # Navigation sidebar
    │   │   ├── MobileBottomNav.tsx # Mobile navigation
    │   │   └── ProtectedRoute.tsx # Route protection
    │   ├── contexts/         # React contexts
    │   │   └── AuthContext.tsx # Authentication state
    │   ├── services/         # API services
    │   │   └── apiService.js # Backend communication
    │   └── assets/           # Static assets
```

## Technologies

- **Backend**: Node.js, Express.js, MongoDB, JWT
- **Frontend**: Next.js 15, TypeScript, Tailwind CSS
- **Authentication**: JWT tokens, bcrypt
- **File Upload**: Cloudinary, Multer
- **Email**: Nodemailer for notifications
- **Maps**: Leaflet for navigation
- **AI/ML**: Pluggable prediction service interface
- **Database**: MongoDB with Mongoose ODM
