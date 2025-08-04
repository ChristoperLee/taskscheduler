# TaskScheduler

A modern web-based task scheduler application that allows users to create, manage, and share custom schedulers with comprehensive analytics, social features, and admin management capabilities.

## Features

### 📅 **Schedule Management**
- Multiple view modes: Daily, Weekly, Monthly, and List views
- Create, edit, and delete custom schedulers with rich scheduling options
- Public/private schedule settings with category organization
- Personal dashboard with statistics and performance metrics
- **🆕 Enhanced UX Design**: Progressive disclosure form with 5 colored sections
- **🆕 Color-Coded Scheduling**: 8-color theme system for visual organization
- **🆕 Smart Date Handling**: Target date first approach with automatic day display
- **🆕 Daily Recurrence**: Complete daily recurrence support with proper view integration
- **🆕 Context-Aware Labels**: Dynamic labels like "Every Thursday" instead of generic "Weekly"

### 👥 **User & Social Features**
- User authentication and profile management with role-based access
- Social features (like, share, usage tracking)
- Browse and discover public schedules with advanced search/filtering
- User interaction analytics and engagement tracking

### 📊 **Analytics & Insights**
- **Platform Analytics**: Real-time insights into platform usage and trends
- **Popular Schedulers**: Ranking system with popularity scores and timeframe filtering
- **Trending Content**: Recent activity tracking and engagement metrics
- **Category Analysis**: Performance statistics across different schedule types

### 🛡️ **Admin System**
- Complete admin dashboard with user and content management
- Role-based access control (admin/user permissions)
- Platform statistics and moderation tools
- User management with role assignment and content oversight

### 🔍 **Discovery & Browse**
- Advanced search and filtering for schedule discovery
- Category-based browsing with comprehensive filters
- Schedule recommendations and popularity rankings
- Real-time usage and engagement metrics

### 🎨 **Enhanced User Experience (Latest Update)**
- **Progressive Disclosure Design**: 5-step colored form sections for intuitive item creation
  - 📝 Blue: Basic Information (Title, Description)
  - 📅 Green: Target Date (with automatic day display)
  - ⏰ Purple: Time Range (Start/End times)
  - 🔄 Orange: Recurrence Pattern (with live preview)
  - 🎨 Pink: Color Theme (8-color picker with visual preview)
- **Smart Date First Approach**: Select date first, see day automatically
- **Color-Coded Organization**: 8 professional colors for visual schedule organization
- **Context-Aware Labels**: "Every Thursday" instead of generic "Weekly" labels
- **Timezone-Safe Operations**: Consistent date handling across all time zones
- **Occurrence Preview**: Live preview of how recurring events will appear

## Tech Stack

- **Frontend**: React.js with TypeScript
- **Backend**: Node.js with Express
- **Database**: PostgreSQL
- **Authentication**: JWT tokens
- **Styling**: Tailwind CSS
- **State Management**: Redux Toolkit

## Quick Start

### Prerequisites

- Node.js (v16 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd TaskScheduler
   ```

2. **Install dependencies**
   ```bash
   npm run install-all
   ```

3. **Set up environment variables**
   ```bash
   cp server/.env.example server/.env
   # Edit server/.env with your database credentials
   ```

4. **Set up the database**
   ```bash
   npm run setup-db
   ```

5. **Seed the database with sample data**
   ```bash
   npm run seed
   ```

6. **Start the development servers**
   ```bash
   npm run dev
   ```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5001

### Admin Access
A default admin user is created during database setup:
- **Username**: admin
- **Email**: admin@taskscheduler.com
- **Password**: admin123
- **Access**: Navigate to `/admin` after login for admin dashboard

## Project Structure

```
TaskScheduler/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── store/         # Redux store
│   │   ├── services/      # API services
│   │   └── utils/         # Utility functions
│   └── public/            # Static assets
├── server/                # Node.js backend
│   ├── src/
│   │   ├── controllers/   # Route controllers
│   │   ├── models/        # Database models
│   │   ├── routes/        # API routes
│   │   ├── middleware/    # Custom middleware
│   │   └── utils/         # Utility functions
│   └── database/          # Database migrations and seeds
└── docs/                  # Documentation
```

## API Documentation

The API documentation is available at `/api-docs` when the server is running.

### Key Endpoints

#### **Authentication**
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

#### **Schedulers**
- `GET /api/schedulers` - Get all public schedulers (with filters)
- `GET /api/schedulers/popular` - Get top popular schedulers
- `GET /api/schedulers/my` - Get current user's schedulers
- `POST /api/schedulers` - Create new scheduler
- `GET /api/schedulers/:id/daily/:date` - Get daily view data
- `GET /api/schedulers/:id/weekly/:week` - Get weekly view data
- `GET /api/schedulers/:id/monthly/:month` - Get monthly view data

#### **Analytics**
- `GET /api/analytics/overview` - Platform statistics and insights
- `GET /api/analytics/popular` - Popular schedulers with scores
- `GET /api/analytics/trending` - Trending schedulers by recent activity
- `GET /api/analytics/categories` - Category performance statistics

#### **Admin (Admin Role Required)**
- `GET /api/admin/users` - Get all users with statistics
- `GET /api/admin/schedulers` - Get all schedulers for moderation
- `GET /api/admin/stats` - Comprehensive platform analytics
- `PUT /api/admin/users/:id/role` - Update user roles
- `DELETE /api/admin/users/:id` - Delete users

## Development

### Running Tests
```bash
# Frontend tests
cd client && npm test

# Backend tests
cd server && npm test
```

### Building for Production
```bash
npm run build
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## License

MIT License - see LICENSE file for details 