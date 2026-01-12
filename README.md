# Exam Hall Management System

A comprehensive web-based system for managing exam halls, scheduling exams, and handling student and teacher registrations.

## 🚀 Features

### Core Functionality
- **User Management**: Multi-role authentication (Admin, Teacher, Student, Invigilator)
- **Student Management**: Registration, bulk upload, profile management
- **Teacher Management**: Registration, assignment, profile management
- **Subject Management**: Course and subject administration
- **Classroom Management**: Room allocation and capacity management
- **Exam Scheduling**: Automated exam scheduling with conflict detection
- **Seating Arrangement**: Intelligent seating allocation
- **Invigilator Assignment**: Automatic invigilator assignment
- **Notification System**: Email notifications and in-app alerts
- **Reporting**: Comprehensive reports and analytics

### Security Features
- JWT-based authentication with refresh tokens
- Role-based access control (RBAC)
- Password hashing with bcrypt
- Rate limiting and security headers
- Input validation and sanitization
- CSRF protection
- Secure cookie handling

### Technical Features
- **Backend**: Node.js with Express.js
- **Frontend**: React with Vite
- **Database**: MongoDB with Mongoose ODM
- **Testing**: Jest for backend, Vitest for frontend
- **Styling**: Tailwind CSS
- **State Management**: React Context API
- **API**: RESTful API with proper error handling

## 📋 Prerequisites

- Node.js (v16 or higher)
- MongoDB (v5 or higher)
- npm or yarn package manager

## 🛠️ Installation

### 1. Clone the Repository
```bash
git clone <repository-url>
cd exam-hall-management-system
```

### 2. Backend Setup
```bash
cd Backend

# Install dependencies
npm install

# Copy environment file
cp env.example .env

# Edit .env file with your configuration
# See Environment Configuration section below

# Start development server
npm run dev
```

### 3. Frontend Setup
```bash
cd Frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

## ⚙️ Environment Configuration

### Backend Environment Variables (.env)

```env
# Application Configuration
NODE_ENV=development
PORT=5000
APP_URL=http://localhost:3000
INSTITUTE_NAME=Your Institute Name

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/exam-hall-management

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-at-least-32-characters-long
JWT_EXPIRE=15m
JWT_REFRESH_SECRET=your-super-secret-refresh-key-at-least-32-characters-long
JWT_REFRESH_EXPIRE=7d

# Email Configuration (SMTP)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_SECURE=false

# CORS Configuration
CORS_ORIGIN=http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# File Upload Configuration
MAX_FILE_SIZE=5242880
UPLOAD_PATH=uploads

# Security Configuration
BCRYPT_ROUNDS=12

# Logging Configuration
LOG_LEVEL=info
```

## 🧪 Testing

### Backend Testing
```bash
cd Backend

# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Frontend Testing
```bash
cd Frontend

# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run tests with UI
npm run test:ui
```

## 📁 Project Structure

```
Exam Hall Management System/
├── Backend/
│   ├── __tests__/           # Test files
│   ├── config/              # Configuration files
│   ├── controllers/         # Route controllers
│   ├── middleware/          # Custom middleware
│   ├── models/              # Database models
│   ├── routes/              # API routes
│   ├── services/            # Business logic
│   ├── utils/               # Utility functions
│   ├── uploads/             # File uploads
│   ├── server.js            # Main server file
│   └── package.json
├── Frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── context/         # React context
│   │   ├── pages/           # Page components
│   │   ├── services/        # API services
│   │   ├── test/            # Test setup
│   │   ├── App.jsx          # Main app component
│   │   └── main.jsx         # Entry point
│   ├── public/              # Static files
│   ├── vite.config.js       # Vite configuration
│   └── package.json
└── README.md
```

## 🔐 Authentication & Authorization

### User Roles
- **Admin**: Full system access
- **Teacher**: Manage subjects, view assigned exams
- **Student**: View exam schedules, personal information
- **Invigilator**: View assigned exam duties

### API Authentication
- JWT tokens for API access
- Refresh tokens for automatic token renewal
- Role-based route protection
- Permission-based access control

## 📊 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### Students
- `GET /api/students` - Get all students
- `POST /api/students` - Create student
- `PUT /api/students/:id` - Update student
- `DELETE /api/students/:id` - Delete student
- `POST /api/students/bulk-upload` - Bulk upload students

### Teachers
- `GET /api/teachers` - Get all teachers
- `POST /api/teachers` - Create teacher
- `PUT /api/teachers/:id` - Update teacher
- `DELETE /api/teachers/:id` - Delete teacher

### Subjects
- `GET /api/subjects` - Get all subjects
- `POST /api/subjects` - Create subject
- `PUT /api/subjects/:id` - Update subject
- `DELETE /api/subjects/:id` - Delete subject

### Classrooms
- `GET /api/classrooms` - Get all classrooms
- `POST /api/classrooms` - Create classroom
- `PUT /api/classrooms/:id` - Update classroom
- `DELETE /api/classrooms/:id` - Delete classroom

### Exams
- `GET /api/exams` - Get all exams
- `POST /api/exams` - Create exam
- `PUT /api/exams/:id` - Update exam
- `DELETE /api/exams/:id` - Delete exam
- `POST /api/exams/schedule` - Schedule exam

## 🚀 Deployment

### Production Setup

1. **Environment Configuration**
   ```bash
   NODE_ENV=production
   MONGODB_URI=your-production-mongodb-uri
   JWT_SECRET=your-production-jwt-secret
   EMAIL_HOST=your-smtp-host
   EMAIL_USER=your-email
   EMAIL_PASS=your-password
   ```

2. **Backend Deployment**
   ```bash
   cd Backend
   npm install --production
   npm start
   ```

3. **Frontend Deployment**
   ```bash
   cd Frontend
   npm run build
   # Deploy the dist folder to your hosting service
   ```

### Docker Deployment (Optional)
```bash
# Build and run with Docker Compose
docker-compose up -d
```

## 🔧 Development

### Code Quality
- ESLint for code linting
- Prettier for code formatting
- Husky for pre-commit hooks

### Available Scripts

#### Backend
```bash
npm run dev          # Start development server
npm run start        # Start production server
npm test             # Run tests
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Run tests with coverage
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint issues
npm run format       # Format code with Prettier
```

#### Frontend
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm test             # Run tests
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Run tests with coverage
npm run lint         # Run ESLint
```

## 🐛 Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   - Ensure MongoDB is running
   - Check MONGODB_URI in .env file
   - Verify network connectivity

2. **JWT Token Issues**
   - Ensure JWT_SECRET is at least 32 characters
   - Check token expiration settings
   - Verify refresh token configuration

3. **Email Configuration**
   - Check SMTP settings
   - Verify email credentials
   - Test email functionality

4. **CORS Issues**
   - Update CORS_ORIGIN in .env
   - Check frontend URL configuration
   - Verify API endpoint URLs

### Debug Mode
```bash
# Backend debug
DEBUG=* npm run dev

# Frontend debug
npm run dev -- --debug
```

## 📈 Performance Optimization

### Backend
- Database indexing
- Query optimization
- Caching strategies
- Rate limiting
- Compression middleware

### Frontend
- Code splitting
- Lazy loading
- Image optimization
- Bundle optimization
- Caching strategies

## 🔒 Security Considerations

- All passwords are hashed using bcrypt
- JWT tokens have short expiration times
- Refresh tokens are stored in httpOnly cookies
- Input validation on all endpoints
- Rate limiting to prevent abuse
- CORS configuration for cross-origin requests
- Security headers with Helmet
- SQL injection prevention with Mongoose

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📞 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation

## 🗺️ Roadmap

### Future Features
- [ ] Real-time notifications
- [ ] Mobile app development
- [ ] Advanced analytics dashboard
- [ ] Integration with LMS systems
- [ ] Automated exam scheduling algorithms
- [ ] Multi-language support
- [ ] Advanced reporting features
- [ ] API documentation with Swagger
- [ ] WebSocket support for real-time updates
- [ ] Advanced user permissions system

---

**Note**: This system is designed for educational institutions and should be deployed with appropriate security measures in production environments. 