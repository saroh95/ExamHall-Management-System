# Exam Hall Management System - Backend

A robust Node.js/Express.js backend for managing exam halls, students, teachers, and exam scheduling.

## 🏗️ Project Structure

```
Backend/
├── config/                 # Configuration files
│   ├── database.js        # Database connection configuration
│   ├── cors.js           # CORS configuration
│   ├── rateLimit.js      # Rate limiting configuration
│   └── environment.js    # Environment variables validation
├── constants/             # Application constants
│   └── index.js          # Centralized constants
├── controllers/           # Route controllers
│   ├── authController.js
│   ├── studentController.js
│   └── teacherController.js
├── middleware/            # Custom middleware
│   ├── auth.js           # Authentication middleware
│   ├── upload.js         # File upload middleware
│   └── errorHandler.js   # Error handling middleware
├── models/               # Database models
│   ├── User.js
│   ├── Student.js
│   ├── Teacher.js
│   ├── Subject.js
│   ├── Classroom.js
│   ├── Exam.js
│   └── Department.js
├── routes/               # API routes
│   ├── index.js         # Route aggregator
│   ├── auth.js
│   ├── users.js
│   ├── students.js
│   ├── teachers.js
│   ├── subjects.js
│   ├── classrooms.js
│   ├── exams.js
│   └── departments.js
├── services/             # Business logic services
│   ├── emailService.js   # Email handling
│   ├── fileService.js    # File operations
│   └── queryService.js   # Database query utilities
├── utils/                # Utility functions
│   ├── logger.js         # Logging utility
│   ├── responseHandler.js # Response formatting
│   ├── asyncHandler.js   # Async error handling
│   └── validation.js     # Validation utilities
├── validations/          # Validation schemas
│   └── authValidation.js
├── uploads/              # File upload directory
├── logs/                 # Application logs
├── server.js             # Main application file
├── package.json
└── env.example
```

## 🚀 Features

- **Authentication & Authorization**: JWT-based authentication with role-based access control
- **File Upload**: Secure file upload with validation and processing
- **Email Service**: Automated email notifications
- **Rate Limiting**: API rate limiting for security
- **Error Handling**: Comprehensive error handling and logging
- **Validation**: Input validation using express-validator
- **Pagination**: Built-in pagination for all list endpoints
- **Logging**: Structured logging with file and console output
- **CORS**: Configurable CORS settings
- **Security**: Helmet.js for security headers

## 📋 Prerequisites

- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp env.example .env
   ```
   
   Edit `.env` file with your configuration:
   ```env
   NODE_ENV=development
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/exam-hall-management
   JWT_SECRET=your-super-secret-jwt-key
   JWT_REFRESH_SECRET=your-super-secret-refresh-key
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-app-password
   FRONTEND_URL=http://localhost:3000
   ```

4. **Start the server**
   ```bash
   # Development
   npm run dev
   
   # Production
   npm start
   ```

## 📚 API Documentation

### Authentication Endpoints

- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### User Management

- `GET /api/users` - Get all users (paginated)
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Students

- `GET /api/students` - Get all students (paginated)
- `POST /api/students` - Create new student
- `GET /api/students/:id` - Get student by ID
- `PUT /api/students/:id` - Update student
- `DELETE /api/students/:id` - Delete student
- `POST /api/students/bulk-upload` - Bulk upload students

### Teachers

- `GET /api/teachers` - Get all teachers (paginated)
- `POST /api/teachers` - Create new teacher
- `GET /api/teachers/:id` - Get teacher by ID
- `PUT /api/teachers/:id` - Update teacher
- `DELETE /api/teachers/:id` - Delete teacher

### Subjects

- `GET /api/subjects` - Get all subjects (paginated)
- `POST /api/subjects` - Create new subject
- `GET /api/subjects/:id` - Get subject by ID
- `PUT /api/subjects/:id` - Update subject
- `DELETE /api/subjects/:id` - Delete subject

### Classrooms

- `GET /api/classrooms` - Get all classrooms (paginated)
- `POST /api/classrooms` - Create new classroom
- `GET /api/classrooms/:id` - Get classroom by ID
- `PUT /api/classrooms/:id` - Update classroom
- `DELETE /api/classrooms/:id` - Delete classroom

### Exams

- `GET /api/exams` - Get all exams (paginated)
- `POST /api/exams` - Create new exam
- `GET /api/exams/:id` - Get exam by ID
- `PUT /api/exams/:id` - Update exam
- `DELETE /api/exams/:id` - Delete exam
- `POST /api/exams/:id/schedule` - Schedule exam

### Departments

- `GET /api/departments` - Get all departments (paginated)
- `POST /api/departments` - Create new department
- `GET /api/departments/:id` - Get department by ID
- `PUT /api/departments/:id` - Update department
- `DELETE /api/departments/:id` - Delete department

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `development` |
| `PORT` | Server port | `5000` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/exam-hall-management` |
| `JWT_SECRET` | JWT secret key | Required |
| `JWT_REFRESH_SECRET` | JWT refresh secret key | Required |
| `SMTP_HOST` | SMTP server host | - |
| `SMTP_PORT` | SMTP server port | `587` |
| `SMTP_USER` | SMTP username | - |
| `SMTP_PASS` | SMTP password | - |
| `FRONTEND_URL` | Frontend URL | `http://localhost:3000` |

### Rate Limiting

The API implements rate limiting with the following defaults:
- General API: 100 requests per 15 minutes
- Authentication: 5 requests per 15 minutes
- File uploads: 10 requests per hour

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage
```

## 📝 Logging

The application uses structured logging with the following levels:
- `info`: General information
- `warn`: Warnings
- `error`: Errors
- `debug`: Debug information (development only)

Logs are written to both console and files in the `logs/` directory.

## 🔒 Security Features

- JWT-based authentication
- Role-based access control
- Rate limiting
- Input validation and sanitization
- CORS protection
- Security headers (Helmet.js)
- File upload validation
- SQL injection protection (MongoDB)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support, please contact the development team or create an issue in the repository. 