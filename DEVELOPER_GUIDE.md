# 👨‍💻 Developer Guide
# Exam Hall Management System

## 🎯 **Quick Start for Developers**

This guide helps new developers understand, set up, and contribute to the Exam Hall Management System.

---

## 🏗️ **System Architecture Overview**

### **High-Level Architecture**
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Database      │
│   (React)       │◄──►│   (Node.js)     │◄──►│   (MongoDB)     │
│   Port: 5173    │    │   Port: 5000    │    │   Port: 27017   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### **Technology Stack**
- **Frontend:** React 19.1.0 + Vite + Tailwind CSS
- **Backend:** Node.js + Express.js + Mongoose
- **Database:** MongoDB
- **Authentication:** JWT
- **State Management:** React Context API

---

## 🚀 **Development Setup**

### **Prerequisites**
```bash
# Required software
Node.js 18+ (https://nodejs.org/)
MongoDB 4.4+ (https://www.mongodb.com/)
Git (https://git-scm.com/)

# Optional but recommended
VS Code (https://code.visualstudio.com/)
MongoDB Compass (https://www.mongodb.com/products/compass)
Postman (https://www.postman.com/)
```

### **Environment Setup**

1. **Clone Repository**
```bash
git clone <repository-url>
cd exam-hall-management-system
```

2. **Install Dependencies**
```bash
# Install root dependencies
npm install

# Install backend dependencies
cd Backend
npm install

# Install frontend dependencies
cd ../Frontend
npm install
```

3. **Environment Configuration**
```bash
# Copy environment template
cp Backend/env.example Backend/.env

# Edit environment variables
nano Backend/.env
```

**Required Environment Variables:**
```env
# Database
MONGODB_URI=mongodb://localhost:27017/exam_management

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRE=24h

# Server
PORT=5000
NODE_ENV=development

# Email (Optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

4. **Database Setup**
```bash
# Start MongoDB
mongod

# Seed initial data (optional)
cd Backend
npm run seed
```

5. **Start Development Servers**
```bash
# Terminal 1 - Backend
cd Backend
npm run dev

# Terminal 2 - Frontend
cd Frontend
npm run dev
```

6. **Verify Setup**
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000
- API Health: http://localhost:5000/api/health

---

## 📁 **Project Structure Deep Dive**

### **Backend Structure**
```
Backend/
├── config/                 # Configuration files
│   ├── database.js        # MongoDB connection
│   ├── cors.js           # CORS configuration
│   ├── rateLimit.js      # Rate limiting
│   └── environment.js    # Environment validation
├── controllers/           # Request handlers
│   ├── authController.js  # Authentication logic
│   ├── studentController.js # Student CRUD
│   ├── teacherController.js # Teacher CRUD
│   └── ...
├── middleware/            # Custom middleware
│   ├── auth.js           # JWT authentication
│   ├── errorHandler.js   # Error handling
│   └── upload.js         # File upload
├── models/               # Database schemas
│   ├── User.js           # User model
│   ├── Student.js        # Student model
│   ├── Teacher.js        # Teacher model
│   └── ...
├── routes/               # API routes
│   ├── index.js         # Route aggregator
│   ├── auth.js          # Auth routes
│   ├── students.js      # Student routes
│   └── ...
├── services/             # Business logic
│   ├── unifiedEnrollmentScheduler.js # Main scheduler
│   ├── intelligentParallelScheduler.js # Parallel scheduling
│   ├── balancedDutyAssignmentService.js # Teacher duties
│   └── ...
├── utils/                # Utility functions
│   ├── logger.js         # Logging utility
│   ├── responseHandler.js # API responses
│   └── validation.js     # Validation helpers
├── validations/          # Input validation
│   └── authValidation.js # Auth validation
├── constants/            # Application constants
│   └── index.js         # Main constants
├── scripts/              # Utility scripts
│   ├── cleanup-project.js # Project cleanup
│   ├── fix-teacher-duties.js # Duty fixes
│   └── ...
└── server.js             # Main server file
```

### **Frontend Structure**
```
Frontend/src/
├── components/           # Reusable components
│   ├── Classroom/       # Classroom components
│   ├── ExamScheduler/   # Old scheduler components
│   ├── ExamTimetable/   # Timetable components
│   ├── Students/        # Student components
│   ├── Teachers/        # Teacher components
│   ├── Users/           # User components
│   └── Settings/        # Settings components
├── pages/               # Page components
│   ├── Dashboard.jsx    # Main dashboard
│   ├── Login.jsx        # Login page
│   ├── Students.jsx     # Student management
│   ├── Teachers.jsx     # Teacher management
│   ├── UnifiedExamScheduler.jsx # Main scheduler
│   └── ...
├── services/            # API services
│   ├── api.js          # Main API client
│   ├── unifiedExamSchedulerAPI.js # Scheduler API
│   └── settings.js     # Settings API
├── context/             # React context
│   └── UserContext.jsx  # User context
├── utils/               # Utility functions
│   ├── permissions.js   # Permission utilities
│   ├── timeFormatter.js # Time formatting
│   └── ...
├── constants/           # Frontend constants
│   ├── index.js        # Main constants
│   ├── student.js      # Student constants
│   └── teacher.js      # Teacher constants
├── hooks/               # Custom hooks
│   └── useDebounce.js   # Debounce hook
├── data/                # Mock data
│   └── mockData.js      # Mock data
└── test/                # Test files
    └── setup.js         # Test setup
```

---

## 🔧 **Core Algorithms Explained**

### **1. Intelligent Parallel Scheduling**

**Purpose:** Schedule multiple exams on the same day without student conflicts

**Key Algorithm:**
```javascript
// 1. Group subjects by department overlap
const groupedSubjects = this.groupSubjectsByDepartment(subjects);

// 2. Check for student conflicts
const conflicts = this.detectStudentConflicts(subject1, subject2);

// 3. Schedule non-conflicting subjects together
if (!conflicts) {
  this.scheduleSubjectsTogether([subject1, subject2], timeSlot);
}
```

**Usage:**
```javascript
// In UnifiedExamScheduler.jsx
const formData = {
  useParallelScheduling: true, // Enable parallel scheduling
  // ... other options
};
```

### **2. Balanced Teacher Duty Assignment**

**Purpose:** Ensure all teachers get fair invigilation duties

**Key Algorithm:**
```javascript
// 1. Calculate current workload per teacher
const workloadMap = await this.getGlobalTeacherWorkload(teachers);

// 2. Sort teachers by workload (least busy first)
const sortedTeachers = this.sortByWorkload(teachers, workloadMap);

// 3. Assign duties in round-robin fashion
const assignments = this.createBalancedAssignments(sortedTeachers, classroomCount);
```

**Usage:**
```javascript
// Automatic in all schedulers
const balancedDutyService = require('./balancedDutyAssignmentService');
const assignments = await balancedDutyService.assignBalancedInvigilators({
  examDate,
  timeSlot,
  classroomCount,
  teachersPerClassroom: 2
});
```

### **3. Enrollment-Based Subject Filtering**

**Purpose:** Get only subjects that have enrolled students

**Key Algorithm:**
```javascript
// 1. Get active students by criteria
const students = await Student.find({
  department: { $in: departments },
  semester: { $in: semesters },
  isActive: true
});

// 2. Get enrollments for these students
const enrollments = await Enrollment.find({
  student: { $in: students.map(s => s._id) }
}).populate('subject');

// 3. Group by subject and filter minimum enrollment
const subjectsWithEnrollments = this.filterSubjectsByEnrollment(enrollments);
```

---

## 🛠️ **Development Workflow**

### **1. Feature Development**

**Step 1: Create Feature Branch**
```bash
git checkout -b feature/new-feature-name
```

**Step 2: Backend Development**
```bash
cd Backend
# Create new controller
touch controllers/newFeatureController.js
# Create new routes
touch routes/newFeature.js
# Create new model (if needed)
touch models/NewFeature.js
# Add tests
touch __tests__/newFeature.test.js
```

**Step 3: Frontend Development**
```bash
cd Frontend
# Create new component
mkdir src/components/NewFeature
touch src/components/NewFeature/NewFeature.jsx
# Create new page (if needed)
touch src/pages/NewFeature.jsx
# Add API service
touch src/services/newFeatureAPI.js
```

**Step 4: Testing**
```bash
# Backend tests
cd Backend
npm test

# Frontend tests
cd Frontend
npm test
```

**Step 5: Commit and Push**
```bash
git add .
git commit -m "feat: add new feature"
git push origin feature/new-feature-name
```

### **2. Code Review Process**

**Pull Request Template:**
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed

## Screenshots (if applicable)
Add screenshots here

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No console.log statements
- [ ] Error handling implemented
```

### **3. Database Migrations**

**Adding New Fields:**
```javascript
// In model file
const newField = {
  type: String,
  required: false,
  default: 'default_value'
};

// Update existing documents
db.collection.updateMany(
  { newField: { $exists: false } },
  { $set: { newField: 'default_value' } }
);
```

**Removing Fields:**
```javascript
// Remove field from all documents
db.collection.updateMany(
  {},
  { $unset: { oldField: "" } }
);
```

---

## 🧪 **Testing Guide**

### **Backend Testing**

**Unit Tests:**
```javascript
// __tests__/student.test.js
const request = require('supertest');
const app = require('../server');

describe('Student API', () => {
  test('GET /api/students should return students', async () => {
    const response = await request(app)
      .get('/api/students')
      .set('Authorization', 'Bearer ' + token);
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });
});
```

**Integration Tests:**
```javascript
// __tests__/scheduler.test.js
describe('Exam Scheduler', () => {
  test('should schedule exams without conflicts', async () => {
    const scheduleData = {
      semesters: ['Semester 1'],
      departments: ['CSE'],
      dateRange: { start: '2024-12-01', end: '2024-12-05' }
    };
    
    const response = await request(app)
      .post('/api/unified-exam-scheduler/schedule')
      .send(scheduleData);
    
    expect(response.status).toBe(200);
    expect(response.body.data.exams.length).toBeGreaterThan(0);
  });
});
```

### **Frontend Testing**

**Component Tests:**
```javascript
// __tests__/StudentTable.test.jsx
import { render, screen } from '@testing-library/react';
import StudentTable from '../components/Students/StudentTable';

test('renders student table', () => {
  const students = [
    { id: 1, name: 'John Doe', studentId: 'CSE001' }
  ];
  
  render(<StudentTable students={students} />);
  expect(screen.getByText('John Doe')).toBeInTheDocument();
});
```

**API Service Tests:**
```javascript
// __tests__/api.test.js
import { api } from '../services/api';

test('should fetch students', async () => {
  const mockResponse = { data: { students: [] } };
  jest.spyOn(api, 'get').mockResolvedValue(mockResponse);
  
  const result = await api.get('/students');
  expect(result.data.students).toEqual([]);
});
```

### **Running Tests**

```bash
# Backend tests
cd Backend
npm test                    # Run all tests
npm run test:watch         # Watch mode
npm run test:coverage      # With coverage

# Frontend tests
cd Frontend
npm test                   # Run all tests
npm run test:watch         # Watch mode
npm run test:coverage      # With coverage
```

---

## 🐛 **Debugging Guide**

### **Backend Debugging**

**1. Enable Debug Logging**
```javascript
// In server.js
process.env.DEBUG = '*';

// In specific files
const debug = require('debug')('app:module');
debug('Debug message');
```

**2. Database Query Debugging**
```javascript
// Enable Mongoose debug
mongoose.set('debug', true);

// Log specific queries
const students = await Student.find({ department: 'CSE' })
  .explain('executionStats');
console.log(students);
```

**3. API Request Debugging**
```javascript
// Add request logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`, req.body);
  next();
});
```

### **Frontend Debugging**

**1. React Developer Tools**
- Install React Developer Tools browser extension
- Use Components tab to inspect state and props
- Use Profiler tab to identify performance issues

**2. Console Debugging**
```javascript
// Add debug logging
console.log('Component props:', props);
console.log('State:', state);

// Use React DevTools
console.log('Component instance:', this);
```

**3. Network Debugging**
```javascript
// Log API requests
axios.interceptors.request.use(request => {
  console.log('API Request:', request);
  return request;
});

axios.interceptors.response.use(response => {
  console.log('API Response:', response);
  return response;
});
```

---

## 📊 **Performance Optimization**

### **Backend Optimization**

**1. Database Indexing**
```javascript
// Add indexes for frequently queried fields
StudentSchema.index({ studentId: 1 });
StudentSchema.index({ department: 1, semester: 1 });
ExamSchema.index({ examDate: 1, status: 1 });
```

**2. Query Optimization**
```javascript
// Use select to limit fields
const students = await Student.find({ department: 'CSE' })
  .select('studentId fullName email')
  .lean(); // Returns plain objects, faster

// Use populate efficiently
const enrollments = await Enrollment.find({})
  .populate('student', 'studentId fullName')
  .populate('subject', 'subjectCode subjectName');
```

**3. Caching**
```javascript
// Use node-cache for frequently accessed data
const cache = require('node-cache');
const myCache = new cache({ stdTTL: 600 }); // 10 minutes

// Cache expensive operations
const getCachedData = (key, fetchFunction) => {
  let data = myCache.get(key);
  if (!data) {
    data = fetchFunction();
    myCache.set(key, data);
  }
  return data;
};
```

### **Frontend Optimization**

**1. Component Optimization**
```javascript
// Use React.memo for expensive components
const ExpensiveComponent = React.memo(({ data }) => {
  return <div>{/* expensive rendering */}</div>;
});

// Use useMemo for expensive calculations
const expensiveValue = useMemo(() => {
  return heavyCalculation(data);
}, [data]);

// Use useCallback for event handlers
const handleClick = useCallback(() => {
  // handle click
}, [dependency]);
```

**2. Bundle Optimization**
```javascript
// Code splitting with lazy loading
const LazyComponent = lazy(() => import('./LazyComponent'));

// Use dynamic imports
const loadModule = async () => {
  const module = await import('./module');
  return module.default;
};
```

**3. API Optimization**
```javascript
// Debounce API calls
const debouncedSearch = useMemo(
  () => debounce((query) => {
    api.search(query);
  }, 300),
  []
);

// Use pagination
const [page, setPage] = useState(1);
const [limit] = useState(10);
const students = await api.getStudents({ page, limit });
```

---

## 🔒 **Security Best Practices**

### **Backend Security**

**1. Input Validation**
```javascript
// Use express-validator
const { body, validationResult } = require('express-validator');

const validateStudent = [
  body('email').isEmail().normalizeEmail(),
  body('studentId').isLength({ min: 3, max: 20 }),
  body('department').isIn(['CSE', 'ECE', 'EE', 'ME', 'CE'])
];

// Apply validation middleware
router.post('/students', validateStudent, (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  // Process request
});
```

**2. Authentication & Authorization**
```javascript
// JWT token validation
const authenticateToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Access denied' });
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(403).json({ message: 'Invalid token' });
  }
};

// Role-based access control
const authorize = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }
    next();
  };
};
```

**3. Rate Limiting**
```javascript
// Apply rate limiting
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP'
});

app.use('/api/', limiter);
```

### **Frontend Security**

**1. Input Sanitization**
```javascript
// Sanitize user input
const sanitizeInput = (input) => {
  return input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
};

// Use controlled components
const [input, setInput] = useState('');
const handleChange = (e) => {
  setInput(sanitizeInput(e.target.value));
};
```

**2. XSS Prevention**
```javascript
// Use dangerouslySetInnerHTML carefully
const safeHtml = { __html: sanitizeHtml(userContent) };
<div dangerouslySetInnerHTML={safeHtml} />

// Escape user content
const escapeHtml = (text) => {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
};
```

---

## 📝 **Code Style Guidelines**

### **JavaScript/Node.js Style**

**1. Naming Conventions**
```javascript
// Variables and functions: camelCase
const studentName = 'John Doe';
const getStudentById = (id) => { /* ... */ };

// Constants: UPPER_SNAKE_CASE
const MAX_STUDENTS = 1000;
const API_BASE_URL = 'http://localhost:5000/api';

// Classes: PascalCase
class StudentController { /* ... */ }

// Files: camelCase
studentController.js
unifiedExamScheduler.js
```

**2. Function Structure**
```javascript
// Use async/await for async operations
const getStudents = async (req, res) => {
  try {
    const { page = 1, limit = 10, department } = req.query;
    
    const filter = department ? { department } : {};
    const students = await Student.find(filter)
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    res.json({
      success: true,
      data: students,
      pagination: { page, limit, total: students.length }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching students',
      error: error.message
    });
  }
};
```

**3. Error Handling**
```javascript
// Use try-catch for async operations
try {
  const result = await someAsyncOperation();
  return result;
} catch (error) {
  console.error('Error in operation:', error);
  throw new Error('Operation failed');
}

// Use custom error classes
class ValidationError extends Error {
  constructor(message, field) {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
  }
}
```

### **React Style**

**1. Component Structure**
```javascript
// Functional components with hooks
const StudentTable = ({ students, onEdit, onDelete }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Event handlers
  const handleEdit = useCallback((student) => {
    onEdit(student);
  }, [onEdit]);
  
  // Render
  return (
    <div className="student-table">
      {/* JSX content */}
    </div>
  );
};

// PropTypes for type checking
StudentTable.propTypes = {
  students: PropTypes.array.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired
};
```

**2. State Management**
```javascript
// Use useState for local state
const [formData, setFormData] = useState({
  name: '',
  email: '',
  department: ''
});

// Use useReducer for complex state
const initialState = { students: [], loading: false, error: null };
const [state, dispatch] = useReducer(studentReducer, initialState);

// Use Context for global state
const UserContext = createContext();
const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  );
};
```

---

## 🚀 **Deployment Guide**

### **Development Deployment**

**1. Environment Setup**
```bash
# Set production environment
export NODE_ENV=production

# Set production database
export MONGODB_URI=mongodb://production-server:27017/exam_management

# Set production JWT secret
export JWT_SECRET=production-secret-key
```

**2. Build Frontend**
```bash
cd Frontend
npm run build
```

**3. Start Production Server**
```bash
cd Backend
npm start
```

### **Production Deployment**

**1. Using PM2**
```bash
# Install PM2
npm install -g pm2

# Start application
pm2 start server.js --name "exam-management"

# Monitor application
pm2 monit

# View logs
pm2 logs exam-management
```

**2. Using Docker**
```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY Backend/package*.json ./
RUN npm install

# Copy source code
COPY Backend/ .

# Expose port
EXPOSE 5000

# Start application
CMD ["npm", "start"]
```

**3. Using Nginx**
```nginx
# nginx.conf
server {
    listen 80;
    server_name your-domain.com;
    
    # Frontend
    location / {
        root /var/www/frontend/dist;
        try_files $uri $uri/ /index.html;
    }
    
    # Backend API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## 📚 **Additional Resources**

### **Documentation**
- [React Documentation](https://reactjs.org/docs)
- [Express.js Documentation](https://expressjs.com/)
- [Mongoose Documentation](https://mongoosejs.com/docs/)
- [MongoDB Documentation](https://docs.mongodb.com/)

### **Tools**
- [Postman](https://www.postman.com/) - API testing
- [MongoDB Compass](https://www.mongodb.com/products/compass) - Database GUI
- [VS Code](https://code.visualstudio.com/) - Code editor
- [React Developer Tools](https://chrome.google.com/webstore/detail/react-developer-tools) - Browser extension

### **Learning Resources**
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)
- [React Best Practices](https://reactjs.org/docs/thinking-in-react.html)
- [MongoDB Best Practices](https://docs.mongodb.com/manual/core/best-practices/)

---

**This developer guide provides comprehensive information for developers to understand, contribute to, and maintain the Exam Hall Management System. Follow these guidelines to ensure code quality, security, and maintainability.**
