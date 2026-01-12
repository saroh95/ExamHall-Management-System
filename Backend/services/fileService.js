const fs = require('fs').promises;
const path = require('path');
const csv = require('csv-parser');
const logger = require('../utils/logger');
const { UPLOAD_LIMITS } = require('../constants');

class FileService {
  constructor () {
    this.uploadDir = path.join(__dirname, '../uploads');
    this.ensureUploadDir();
  }

  async ensureUploadDir () {
    try {
      await fs.access(this.uploadDir);
    } catch (error) {
      await fs.mkdir(this.uploadDir, { recursive: true });
      logger.info('Upload directory created', { path: this.uploadDir });
    }
  }

  async saveFile (file, subdirectory = '') {
    try {
      const uploadPath = path.join(this.uploadDir, subdirectory);
      await fs.mkdir(uploadPath, { recursive: true });

      const fileName = `${Date.now()}-${file.originalname}`;
      const filePath = path.join(uploadPath, fileName);

      await fs.writeFile(filePath, file.buffer);

      logger.info('File saved successfully', {
        originalName: file.originalname,
        savedName: fileName,
        path: filePath,
      });

      return {
        fileName,
        originalName: file.originalname,
        path: filePath,
        size: file.size,
        mimetype: file.mimetype,
      };
    } catch (error) {
      logger.error('File save failed', {
        originalName: file.originalname,
        error: error.message,
      });
      throw error;
    }
  }

  async deleteFile (filePath) {
    try {
      await fs.unlink(filePath);
      logger.info('File deleted successfully', { path: filePath });
      return true;
    } catch (error) {
      logger.error('File deletion failed', { path: filePath, error: error.message });
      return false;
    }
  }

  async processCSV (filePath) {
    return new Promise((resolve, reject) => {
      const results = [];

      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', () => {
          logger.info('CSV processing completed', {
            filePath,
            recordsProcessed: results.length,
          });
          resolve(results);
        })
        .on('error', (error) => {
          logger.error('CSV processing failed', { filePath, error: error.message });
          reject(error);
        });
    });
  }

  validateFile (file) {
    const errors = [];

    // Check file size
    if (file.size > UPLOAD_LIMITS.MAX_FILE_SIZE) {
      errors.push(`File size exceeds maximum limit of ${UPLOAD_LIMITS.MAX_FILE_SIZE / (1024 * 1024)}MB`);
    }

    // Check file type
    const allowedTypes = [
      ...UPLOAD_LIMITS.ALLOWED_IMAGE_TYPES,
      ...UPLOAD_LIMITS.ALLOWED_DOCUMENT_TYPES,
      ...UPLOAD_LIMITS.ALLOWED_CSV_TYPES,
    ];

    if (!allowedTypes.includes(file.mimetype)) {
      errors.push('File type not allowed');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  async getFileInfo (filePath) {
    try {
      const stats = await fs.stat(filePath);
      return {
        exists: true,
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime,
      };
    } catch (error) {
      return { exists: false };
    }
  }

  generateThumbnail (imagePath, thumbnailPath, width = 150, height = 150) {
    // This would require a library like sharp for image processing
    // For now, we'll return a placeholder
    logger.info('Thumbnail generation requested', { imagePath, thumbnailPath });
    return Promise.resolve();
  }
}

module.exports = new FileService();
