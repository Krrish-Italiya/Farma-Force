# FarmaForce Dashboard

A modern, responsive dashboard for pharmaceutical sales representatives built with Next.js, TypeScript, and Tailwind CSS.

## Features

### 🔐 Authentication
- **Protected Routes**: Dashboard is only accessible after successful login
- **Automatic Redirects**: Users are redirected to login if not authenticated
- **Persistent Sessions**: Login state is maintained across browser sessions

### 📱 Dashboard Components

#### 1. **Dynamic Greeting**
- Shows "Good Morning", "Good Afternoon", or "Good Evening" based on system time
- Displays user's name from signup details

#### 2. **User Profile**
- Profile image displayed on the right side of the header
- Uses placeholder image: `assets/user img.jpg`

#### 3. **Today's Target Section**
- Progress card showing "Today's Target: 87% Achieved"
- Circular progress indicator with 87% completion
- Medical-themed background icons (pills, stethoscopes, beakers, crosses)
- Default static value (87%) - can be made editable later

#### 4. **Quick Access Grid**
- 6 cards arranged in 2 rows, 3 per row
- Each card has unique styling and icons:
  - **Schedule** 📅 - Light blue theme
  - **KPI Dashboard** 📊 - Light green theme
  - **AI Recommendation** 🤖 - Light purple theme
  - **Alerts** ⚠️ - Light orange theme
  - **Communication** ✉️ - Light pink theme
  - **Performance** 📈 - Light teal theme

#### 5. **Today's Appointments**
- List of appointments in card format
- Default appointments:
  - Dr. Mehta - Cardiologist - 11:30 AM
  - Dr. Johnson - Neurologist - 2:00 PM
- Each appointment has a "Details" button

#### 6. **Floating Action Button**
- Blue circular chat button at bottom-right corner
- Positioned as shown in the design

### 🎨 Styling Features
- **Rounded Corners**: All cards and buttons use rounded corners
- **Soft Background Colors**: Subtle, professional color scheme
- **Shadow Effects**: Cards have subtle shadows for depth
- **Responsive Design**: Uses flexbox/grid for layout
- **Hover Effects**: Interactive elements have hover states

## File Structure

```
src/
├── app/
│   ├── auth/
│   │   ├── login/page.tsx      # Login page
│   │   ├── signup/page.tsx     # Signup page
│   │   └── ...
│   ├── dashboard/
│   │   └── page.tsx            # Main dashboard page
│   ├── layout.tsx              # Root layout with AuthProvider
│   └── page.tsx                # Landing page
├── components/
│   └── ProtectedRoute.tsx      # Route protection component
├── contexts/
│   └── AuthContext.tsx         # Authentication context
└── assets/
    ├── user img.jpg            # User profile placeholder
    └── blue logo.png           # FarmaForce logo
```

## Setup & Usage

### 1. **Installation**
```bash
cd App/frontend
npm install
```

### 2. **Start Development Server**
```bash
npm run dev
```

### 3. **Access the Application**
- **Landing Page**: `http://localhost:3000`
- **Login**: `http://localhost:3000/auth/login`
- **Signup**: `http://localhost:3000/auth/signup`
- **Dashboard**: `http://localhost:3000/dashboard` (requires login)

### 4. **Authentication Flow**
1. User visits landing page
2. If not logged in, redirected to login page
3. After successful login, redirected to dashboard
4. Dashboard is protected - only accessible to authenticated users
5. If accessed without authentication, redirected to login

## Technical Implementation

### **Authentication Context**
- Manages user state across the application
- Handles login/logout operations
- Provides authentication status to components

### **Protected Routes**
- `ProtectedRoute` component wraps dashboard
- Automatically redirects unauthenticated users
- Shows loading state during authentication checks

### **State Management**
- User data stored in localStorage
- Authentication token management
- Automatic session restoration

### **Responsive Design**
- Mobile-first approach
- Tailwind CSS for styling
- Flexible grid layouts

## Customization

### **Modifying Target Percentage**
The default 87% target can be changed in `dashboard/page.tsx`:
```typescript
// Change this value to update the target
const targetPercentage = 87;
```

### **Adding New Quick Access Items**
Modify the `quickAccessItems` array in the dashboard:
```typescript
const quickAccessItems = [
  // ... existing items
  { title: "New Feature", icon: "🆕", bgColor: "bg-gray-50", iconColor: "text-gray-600" }
];
```

### **Updating Appointments**
Modify the `appointments` array to show different appointments:
```typescript
const appointments: Appointment[] = [
  {
    id: "3",
    doctorName: "Dr. New",
    specialty: "Dermatologist",
    time: "3:30 PM",
  }
];
```

## Backend Integration

The dashboard is designed to work with the existing backend API:
- **Login Endpoint**: `POST /api/auth/login`
- **Signup Endpoint**: `POST /api/auth/signup`
- **User Data**: Stored in localStorage after successful authentication

## Browser Compatibility

- Modern browsers with ES6+ support
- Responsive design for mobile and desktop
- Touch-friendly interface for mobile devices

## Future Enhancements

- **Real-time Updates**: Live data from backend APIs
- **Editable Targets**: Allow users to modify target percentages
- **Dynamic Appointments**: Fetch appointments from backend
- **User Preferences**: Customizable dashboard layout
- **Notifications**: Real-time alerts and updates
