# 🔌 API Documentation
# Exam Hall Management System

## 📋 **API Overview**

The Exam Hall Management System provides a comprehensive REST API for managing students, teachers, subjects, exams, and scheduling. All endpoints require authentication except for login and registration.

**Base URL:** `http://localhost:5000/api`
**Authentication:** Bearer Token (JWT)

---

## 🔐 **Authentication Endpoints**

### **Login**
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "64a1b2c3d4e5f6789abcdef0",
      "username": "admin",
      "email": "admin@example.com",
      "role": "admin"
    }
  }
}
```

### **Register**
```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "newuser",
  "email": "user@example.com",
  "password": "password123",
  "role": "teacher"
}
```

### **Logout**
```http
POST /api/auth/logout
Authorization: Bearer <token>
```

---

## 👥 **Student Management**

### **Get All Students**
```http
GET /api/students?page=1&limit=10&department=CSE&semester=Semester 1
Authorization: Bearer <token>
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `department` (optional): Filter by department
- `semester` (optional): Filter by semester
- `search` (optional): Search by name or student ID

### **Create Student**
```http
POST /api/students
Authorization: Bearer <token>
Content-Type: application/json

{
  "studentId": "CSE2024001",
  "fullName": "John Doe",
  "email": "john@example.com",
  "department": "CSE",
  "semester": "Semester 1",
  "academicYear": "2024-2025"
}
```

### **Get Student by ID**
```http
GET /api/students/64a1b2c3d4e5f6789abcdef0
Authorization: Bearer <token>
```

### **Update Student**
```http
PUT /api/students/64a1b2c3d4e5f6789abcdef0
Authorization: Bearer <token>
Content-Type: application/json

{
  "fullName": "John Smith",
  "email": "johnsmith@example.com"
}
```

### **Delete Student**
```http
DELETE /api/students/64a1b2c3d4e5f6789abcdef0
Authorization: Bearer <token>
```

### **Bulk Upload Students**
```http
POST /api/students/bulk-upload
Authorization: Bearer <token>
Content-Type: multipart/form-data

file: students.csv
```

**CSV Format:**
```csv
studentId,fullName,email,department,semester,academicYear
CSE2024001,John Doe,john@example.com,CSE,Semester 1,2024-2025
CSE2024002,Jane Smith,jane@example.com,CSE,Semester 1,2024-2025
```

---

## 👨‍🏫 **Teacher Management**

### **Get All Teachers**
```http
GET /api/teachers?page=1&limit=10&department=CSE
Authorization: Bearer <token>
```

### **Create Teacher**
```http
POST /api/teachers
Authorization: Bearer <token>
Content-Type: application/json

{
  "employeeId": "CSE001",
  "fullName": "Dr. John Smith",
  "email": "john.smith@example.com",
  "department": "CSE",
  "designation": "Professor"
}
```

### **Get Teacher by ID**
```http
GET /api/teachers/64a1b2c3d4e5f6789abcdef0
Authorization: Bearer <token>
```

### **Update Teacher**
```http
PUT /api/teachers/64a1b2c3d4e5f6789abcdef0
Authorization: Bearer <token>
Content-Type: application/json

{
  "fullName": "Dr. John Smith",
  "designation": "Associate Professor"
}
```

### **Delete Teacher**
```http
DELETE /api/teachers/64a1b2c3d4e5f6789abcdef0
Authorization: Bearer <token>
```

---

## 📚 **Subject Management**

### **Get All Subjects**
```http
GET /api/subjects?page=1&limit=10&semester=Semester 1&department=CSE
Authorization: Bearer <token>
```

### **Create Subject**
```http
POST /api/subjects
Authorization: Bearer <token>
Content-Type: application/json

{
  "subjectCode": "CS101",
  "subjectName": "Programming Fundamentals",
  "credits": 3,
  "semester": "Semester 1",
  "department": "CSE",
  "subjectType": "core",
  "sharedWith": ["ECE", "EE"]
}
```

### **Get Subject by ID**
```http
GET /api/subjects/64a1b2c3d4e5f6789abcdef0
Authorization: Bearer <token>
```

### **Update Subject**
```http
PUT /api/subjects/64a1b2c3d4e5f6789abcdef0
Authorization: Bearer <token>
Content-Type: application/json

{
  "subjectName": "Advanced Programming",
  "credits": 4
}
```

### **Delete Subject**
```http
DELETE /api/subjects/64a1b2c3d4e5f6789abcdef0
Authorization: Bearer <token>
```

---

## 🏫 **Classroom Management**

### **Get All Classrooms**
```http
GET /api/classrooms?page=1&limit=10&capacity=50
Authorization: Bearer <token>
```

### **Create Classroom**
```http
POST /api/classrooms
Authorization: Bearer <token>
Content-Type: application/json

{
  "classroomName": "A101",
  "capacity": 60,
  "layout": "theater",
  "facilities": ["projector", "whiteboard", "air_conditioning"]
}
```

### **Get Classroom by ID**
```http
GET /api/classrooms/64a1b2c3d4e5f6789abcdef0
Authorization: Bearer <token>
```

### **Update Classroom**
```http
PUT /api/classrooms/64a1b2c3d4e5f6789abcdef0
Authorization: Bearer <token>
Content-Type: application/json

{
  "capacity": 70,
  "facilities": ["projector", "whiteboard", "air_conditioning", "sound_system"]
}
```

### **Delete Classroom**
```http
DELETE /api/classrooms/64a1b2c3d4e5f6789abcdef0
Authorization: Bearer <token>
```

---

## 📅 **Exam Scheduling (Unified)**

### **Preview Subjects for Scheduling**
```http
POST /api/unified-exam-scheduler/preview
Authorization: Bearer <token>
Content-Type: application/json

{
  "semesters": ["Semester 1", "Semester 2"],
  "departments": ["CSE", "ECE"],
  "academicYear": "2024-2025"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "subjects": [
      {
        "subject": {
          "subjectCode": "CS101",
          "subjectName": "Programming Fundamentals"
        },
        "enrollments": [
          {
            "student": {
              "studentId": "CSE2024001",
              "fullName": "John Doe"
            },
            "department": "CSE",
            "semester": "Semester 1"
          }
        ],
        "totalStudents": 45,
        "departments": ["CSE", "ECE"]
      }
    ],
    "summary": {
      "totalSubjects": 10,
      "totalStudents": 450,
      "departments": ["CSE", "ECE"]
    }
  }
}
```

### **Schedule Exams**
```http
POST /api/unified-exam-scheduler/schedule
Authorization: Bearer <token>
Content-Type: application/json

{
  "examType": "End-Semester",
  "semesters": ["Semester 1", "Semester 2"],
  "departments": ["CSE", "ECE"],
  "dateRange": {
    "start": "2024-12-01",
    "end": "2024-12-15"
  },
  "timeSlots": [
    { "start": "10:00", "end": "13:00" },
    { "start": "14:00", "end": "17:00" }
  ],
  "seatingStrategy": "department-wise",
  "academicYear": "2024-2025",
  "useParallelScheduling": true,
  "useAdvancedScheduling": false,
  "useSmartScheduling": false
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "exams": [
      {
        "id": "64a1b2c3d4e5f6789abcdef0",
        "title": "End-Semester - Programming Fundamentals",
        "subject": "CS101",
        "examDate": "2024-12-01",
        "startTime": "10:00",
        "endTime": "13:00",
        "classrooms": ["A101", "A102"],
        "invigilators": [
          {
            "teacher": "Dr. John Smith",
            "role": "chief_invigilator",
            "assignedClassrooms": ["A101"]
          }
        ],
        "totalStudents": 45
      }
    ],
    "summary": {
      "totalExams": 10,
      "totalStudents": 450,
      "totalClassrooms": 5,
      "totalInvigilators": 20
    }
  }
}
```

### **Get Scheduled Exams**
```http
GET /api/unified-exam-scheduler/exams?semester=Semester 1&department=CSE&status=scheduled
Authorization: Bearer <token>
```

**Query Parameters:**
- `semester` (optional): Filter by semester
- `department` (optional): Filter by department
- `status` (optional): Filter by status (scheduled|in_progress|completed|cancelled)
- `date` (optional): Filter by date (YYYY-MM-DD)
- `page` (optional): Page number
- `limit` (optional): Items per page

### **Get Exam Details**
```http
GET /api/unified-exam-scheduler/exam/64a1b2c3d4e5f6789abcdef0
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "exam": {
      "id": "64a1b2c3d4e5f6789abcdef0",
      "title": "End-Semester - Programming Fundamentals",
      "subject": {
        "code": "CS101",
        "name": "Programming Fundamentals"
      },
      "examDate": "2024-12-01",
      "startTime": "10:00",
      "endTime": "13:00",
      "duration": 180,
      "totalMarks": 100,
      "passingMarks": 40,
      "classrooms": [
        {
          "id": "64a1b2c3d4e5f6789abcdef1",
          "name": "A101",
          "capacity": 60,
          "seatingArrangement": [
            {
              "student": {
                "studentId": "CSE2024001",
                "fullName": "John Doe"
              },
              "seatNumber": "A1",
              "row": 1,
              "column": 1
            }
          ]
        }
      ],
      "invigilators": [
        {
          "teacher": {
            "id": "64a1b2c3d4e5f6789abcdef2",
            "fullName": "Dr. John Smith",
            "employeeId": "CSE001"
          },
          "role": "chief_invigilator",
          "assignedClassrooms": ["A101"]
        }
      ],
      "totalStudents": 45,
      "departments": ["CSE", "ECE"],
      "status": "scheduled"
    }
  }
}
```

### **Cancel Exam**
```http
DELETE /api/unified-exam-scheduler/exam/64a1b2c3d4e5f6789abcdef0
Authorization: Bearer <token>
```

### **Get Student Schedule**
```http
GET /api/unified-exam-scheduler/student/64a1b2c3d4e5f6789abcdef0/schedule?semester=Semester 1
Authorization: Bearer <token>
```

### **Get Teacher Duty Roster**
```http
GET /api/unified-exam-scheduler/teacher/64a1b2c3d4e5f6789abcdef0/duty-roster?date=2024-12-01
Authorization: Bearer <token>
```

---

## 👨‍🏫 **Teacher Duty Management**

### **Get Duty Statistics**
```http
GET /api/teacher-duty/statistics
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalTeachers": 87,
    "teachersWithDuties": 87,
    "teachersWithoutDuties": 0,
    "totalDuties": 200,
    "averageDutiesPerTeacher": 2.3,
    "minDuties": 2,
    "maxDuties": 3,
    "balanceSpread": 1
  }
}
```

### **Get Balance Report**
```http
GET /api/teacher-duty/balance-report
Authorization: Bearer <token>
```

### **Get Teacher Duties**
```http
GET /api/teacher-duty/teacher/64a1b2c3d4e5f6789abcdef0
Authorization: Bearer <token>
```

### **Rebalance Duties**
```http
POST /api/teacher-duty/rebalance
Authorization: Bearer <token>
Content-Type: application/json

{
  "forceRebalance": true,
  "excludeTeachers": []
}
```

### **Check Conflicts**
```http
GET /api/teacher-duty/conflicts?date=2024-12-01&timeSlot=10:00-13:00
Authorization: Bearer <token>
```

### **Get Workload Chart**
```http
GET /api/teacher-duty/workload-chart?period=month&teacherId=64a1b2c3d4e5f6789abcdef0
Authorization: Bearer <token>
```

### **Get Upcoming Roster**
```http
GET /api/teacher-duty/upcoming-roster?days=7
Authorization: Bearer <token>
```

---

## 📊 **Dashboard & Analytics**

### **Get Dashboard Statistics**
```http
GET /api/dashboard/stats
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "students": {
      "total": 1920,
      "active": 1850,
      "byDepartment": {
        "CSE": 480,
        "ECE": 460,
        "EE": 450,
        "ME": 440,
        "CE": 420
      },
      "bySemester": {
        "Semester 1": 480,
        "Semester 2": 460,
        "Semester 3": 440,
        "Semester 4": 420,
        "Semester 5": 400,
        "Semester 6": 380,
        "Semester 7": 360,
        "Semester 8": 340
      }
    },
    "teachers": {
      "total": 87,
      "active": 87,
      "byDepartment": {
        "CSE": 22,
        "ECE": 20,
        "EE": 18,
        "ME": 15,
        "CE": 12
      }
    },
    "exams": {
      "total": 150,
      "scheduled": 120,
      "completed": 25,
      "cancelled": 5,
      "upcoming": 30
    },
    "classrooms": {
      "total": 25,
      "available": 20,
      "occupied": 5,
      "totalCapacity": 1500
    }
  }
}
```

---

## 📈 **Reports & Export**

### **Export Exam Schedule to PDF**
```http
GET /api/unified-exam-scheduler/exam/64a1b2c3d4e5f6789abcdef0/pdf
Authorization: Bearer <token>
```

### **Export Seating Arrangement to Excel**
```http
GET /api/unified-exam-scheduler/exam/64a1b2c3d4e5f6789abcdef0/seating-excel
Authorization: Bearer <token>
```

---

## ⚠️ **Error Responses**

### **Authentication Error**
```json
{
  "success": false,
  "message": "Access denied. No token provided.",
  "error": "UNAUTHORIZED"
}
```

### **Validation Error**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Email is required"
    },
    {
      "field": "password",
      "message": "Password must be at least 6 characters"
    }
  ]
}
```

### **Not Found Error**
```json
{
  "success": false,
  "message": "Student not found",
  "error": "NOT_FOUND"
}
```

### **Server Error**
```json
{
  "success": false,
  "message": "Internal server error",
  "error": "INTERNAL_ERROR"
}
```

---

## 🔒 **Authentication & Authorization**

### **Token Format**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### **Token Expiration**
- **Access Token:** 24 hours
- **Refresh Token:** 7 days

### **Role-based Access**
- **Admin:** Full access to all endpoints
- **Teacher:** Limited access to teacher-specific endpoints
- **Student:** Read-only access to student-specific endpoints

### **Permission Levels**
- **create_exam:** Create and schedule exams
- **view_reports:** Access reports and analytics
- **manage_users:** Manage users and permissions
- **bulk_upload:** Upload bulk data
- **export_data:** Export data and reports

---

## 📝 **Rate Limiting**

### **Rate Limits**
- **General API:** 100 requests per 15 minutes
- **Authentication:** 5 requests per 15 minutes
- **File Upload:** 10 requests per 15 minutes
- **Bulk Operations:** 5 requests per 15 minutes

### **Rate Limit Headers**
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

---

## 🧪 **Testing**

### **Test Endpoints**
```http
GET /api/health
```

**Response:**
```json
{
  "status": "OK",
  "message": "Exam Hall Management System API is running",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "version": "1.0.0"
}
```

### **Test Data**
Use the following test credentials:
- **Admin:** admin@example.com / admin123
- **Teacher:** teacher@example.com / teacher123
- **Student:** student@example.com / student123

---

**This API documentation provides comprehensive information about all available endpoints, request/response formats, and usage examples for the Exam Hall Management System.**
