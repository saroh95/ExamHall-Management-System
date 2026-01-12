const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directory exists
const uploadDir = process.env.UPLOAD_PATH || './uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination (req, file, cb) {
    // Create subdirectories based on file type
    let subDir = 'general';

    if (file.fieldname === 'photo' || file.fieldname === 'profilePicture') {
      subDir = 'profiles';
    } else if (file.fieldname === 'csv' || file.fieldname === 'excel') {
      subDir = 'bulk-uploads';
    } else if (file.fieldname === 'document') {
      subDir = 'documents';
    } else if (file.fieldname === 'image') {
      subDir = 'images';
    }

    const fullPath = path.join(uploadDir, subDir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
    }

    cb(null, fullPath);
  },
  filename (req, file, cb) {
    // Generate unique filename
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);

    cb(null, `${name}-${uniqueSuffix}${ext}`);
  },
});

// File filter function
const fileFilter = (req, file, cb) => {
  // Allow images
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  }
  // Allow CSV files
  else if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
    cb(null, true);
  }
  // Allow Excel files
  else if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
           file.mimetype === 'application/vnd.ms-excel' ||
           file.originalname.endsWith('.xlsx') ||
           file.originalname.endsWith('.xls')) {
    cb(null, true);
  }
  // Allow PDF files
  else if (file.mimetype === 'application/pdf' || file.originalname.endsWith('.pdf')) {
    cb(null, true);
  }
  // Allow text files
  else if (file.mimetype === 'text/plain' || file.originalname.endsWith('.txt')) {
    cb(null, true);
  }
  // Reject other file types
  else {
    cb(new Error('Invalid file type. Only images, CSV, Excel, PDF, and text files are allowed.'), false);
  }
};

// Configure multer
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 100 * 1024 * 1024, // 100MB to allow very large CSVs
    files: 10, // Maximum 10 files
  },
});

// Single file upload
const uploadSingle = (fieldName) => {
  return upload.single(fieldName);
};

// Multiple files upload
const uploadMultiple = (fieldName, maxCount = 10) => {
  return upload.array(fieldName, maxCount);
};

// Multiple fields upload
const uploadFields = (fields) => {
  return upload.fields(fields);
};

// Profile picture upload
const uploadProfilePicture = upload.single('photo');

// Bulk upload (CSV/Excel)
const uploadBulkFile = upload.single('file');

// Document upload
const uploadDocument = upload.single('document');

// Multiple images upload
const uploadImages = upload.array('images', 10);

// Error handling middleware for multer
const handleUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum file size is 5MB.',
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files. Maximum 10 files allowed.',
      });
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        message: 'Unexpected file field.',
      });
    }
  }

  if (error.message.includes('Invalid file type')) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }

  next(error);
};

// Helper function to get file URL
const getFileUrl = (filename, subDir = 'general') => {
  if (!filename) return null;
  return `/uploads/${subDir}/${filename}`;
};

// Helper function to delete file
const deleteFile = (filepath) => {
  if (!filepath) return;

  const fullPath = path.join(process.cwd(), filepath);
  if (fs.existsSync(fullPath)) {
    fs.unlinkSync(fullPath);
  }
};

// Helper function to validate file size
const validateFileSize = (file, maxSize = 5 * 1024 * 1024) => {
  return file.size <= maxSize;
};

// Helper function to validate file type
const validateFileType = (file, allowedTypes = ['image/jpeg', 'image/png', 'image/gif']) => {
  return allowedTypes.includes(file.mimetype);
};

module.exports = {
  upload,
  uploadSingle,
  uploadMultiple,
  uploadFields,
  uploadProfilePicture,
  uploadBulkFile,
  uploadDocument,
  uploadImages,
  handleUploadError,
  getFileUrl,
  deleteFile,
  validateFileSize,
  validateFileType,
};
