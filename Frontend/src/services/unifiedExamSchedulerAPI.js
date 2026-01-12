/**
 * Unified Exam Scheduler API Service
 * 
 * Simplified API for enrollment-based exam scheduling with:
 * - Automatic subject fetching from enrollments
 * - Merged classroom allocation + seating
 * - Intelligent invigilator assignment
 */

import api from './api';

const unifiedExamSchedulerAPI = {
  /**
   * Preview subjects with enrolled students before scheduling
   */
  async getEnrollmentPreview(params) {
    try {
      console.log('🚀 Fetching enrollment preview with optimized query...');
      const response = await api.post('/unified-exam-scheduler/preview', params, {
        timeout: 30000 // 30 seconds timeout
      });
      console.log('✅ Preview received successfully');
      return response.data;
    } catch (error) {
      console.error('❌ Preview error:', error);
      if (error.code === 'ECONNABORTED') {
        throw new Error('Preview request timed out. Please try again.');
      }
      throw error.response?.data || error;
    }
  },

  /**
   * Schedule exams with unified classroom allocation + seating
   */
  async scheduleExams(params) {
    try {
      // Allow longer time for scheduling (classroom allocation + seating)
      const response = await api.post('/unified-exam-scheduler/schedule', params, {
        timeout: 60000, // 60s
      });
      return response.data;
    } catch (error) {
      console.error('Scheduling error:', error);
      console.error('Error response:', error.response);
      console.error('Error data:', error.response?.data);
      
      // Extract error message from various possible locations
      let errorMessage = 'Failed to schedule exams';
      
      if (error.response?.data) {
        // Backend returned structured error
        if (error.response.data.message) {
          errorMessage = error.response.data.message;
        } else if (error.response.data.error) {
          errorMessage = error.response.data.error;
        } else if (typeof error.response.data === 'string') {
          errorMessage = error.response.data;
        }
      } else if (error.message) {
        // Axios error message
        errorMessage = error.message;
      }
      
      // Add status code info if available
      if (error.response?.status) {
        errorMessage = `[${error.response.status}] ${errorMessage}`;
      }
      
      // Create a more detailed error object
      const detailedError = new Error(errorMessage);
      detailedError.status = error.response?.status;
      detailedError.data = error.response?.data;
      detailedError.response = error.response;
      detailedError.originalError = error;
      
      throw detailedError;
    }
  },

  /**
   * Get all scheduled exams with filters
   */
  async getScheduledExams(filters = {}) {
    try {
      const response = await api.get('/unified-exam-scheduler/exams', { params: filters });
      return response.data;
    } catch (error) {
      console.error('Error fetching exams:', error);
      throw error.response?.data || error;
    }
  },

  /**
   * Get detailed exam information
   */
  async getExamDetails(examId) {
    try {
      const response = await api.get(`/unified-exam-scheduler/exam/${examId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching exam details:', error);
      throw error.response?.data || error;
    }
  },

  /**
   * Get student's exam schedule (Hall Ticket)
   */
  async getStudentSchedule(studentId, filters = {}) {
    try {
      const response = await api.get(
        `/unified-exam-scheduler/student/${studentId}/schedule`,
        { params: filters }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching student schedule:', error);
      throw error.response?.data || error;
    }
  },

  /**
   * Get teacher's duty roster
   */
  async getTeacherDutyRoster(teacherId, filters = {}) {
    try {
      const response = await api.get(
        `/unified-exam-scheduler/teacher/${teacherId}/duty-roster`,
        { params: filters }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching duty roster:', error);
      throw error.response?.data || error;
    }
  },

  /**
   * Cancel/delete an exam
   */
  async cancelExam(examId) {
    try {
      const response = await api.delete(`/unified-exam-scheduler/exam/${examId}`);
      return response.data;
    } catch (error) {
      console.error('Error cancelling exam:', error);
      throw error.response?.data || error;
    }
  },

  /**
   * Export exam schedule to PDF
   */
  async exportScheduleToPDF(examId) {
    try {
      const response = await api.get(`/unified-exam-scheduler/exam/${examId}/pdf`, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error('Error exporting PDF:', error);
      throw error.response?.data || error;
    }
  },

  /**
   * Export seating arrangement to Excel
   */
  async exportSeatingToExcel(examId) {
    try {
      const response = await api.get(`/unified-exam-scheduler/exam/${examId}/seating-excel`, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error('Error exporting Excel:', error);
      throw error.response?.data || error;
    }
  }
};

export default unifiedExamSchedulerAPI;

