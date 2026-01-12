const Classroom = require('../models/Classroom');
const { asyncHandler } = require('../middleware/error');
const fs = require('fs');
const csv = require('csv-parser');

// @desc    Create new classroom
// @route   POST /api/classrooms
// @access  Private (Admin)
const createClassroom = asyncHandler(async (req, res) => {
  const {
    roomNumber,
    building,
    floor,
    capacity,
    type,
    facilities,
    seatingLayout,
  } = req.body;

  // Check if classroom already exists
  const existingClassroom = await Classroom.findOne({ roomNumber });
  if (existingClassroom) {
    return res.status(400).json({
      success: false,
      message: 'Classroom with this room number already exists',
    });
  }

  const classroom = await Classroom.create({
    roomNumber,
    building,
    floor,
    capacity,
    type,
    facilities,
    seatingLayout,
  });

  res.status(201).json({
    success: true,
    message: 'Classroom created successfully',
    data: classroom,
  });
});

// @desc    Get all classrooms
// @route   GET /api/classrooms
// @access  Private
const getClassrooms = asyncHandler(async (req, res) => {
  const { type, building, minCapacity } = req.query;

  const query = {};
  if (type) query.type = type;
  if (building) query.building = building;
  if (minCapacity) query.capacity = { $gte: parseInt(minCapacity) };

  const classrooms = await Classroom.find(query).sort({ building: 1, roomNumber: 1 });

  res.json({
    success: true,
    count: classrooms.length,
    data: classrooms,
  });
});

// @desc    Get all classrooms for assignment (no time filtering)
// @route   GET /api/classrooms/all-for-assignment
// @access  Private
const getAllClassroomsForAssignment = asyncHandler(async (req, res) => {
  const classrooms = await Classroom.find({ isActive: true })
    .select('roomNumber building capacity isActive alternateSeating')
    .sort({ building: 1, roomNumber: 1 });

  res.json({
    success: true,
    count: classrooms.length,
    data: classrooms,
  });
});

// @desc    Get single classroom
// @route   GET /api/classrooms/:id
// @access  Private
const getClassroom = asyncHandler(async (req, res) => {
  const classroom = await Classroom.findById(req.params.id);

  if (!classroom) {
    return res.status(404).json({
      success: false,
      message: 'Classroom not found',
    });
  }

  res.json({
    success: true,
    data: classroom,
  });
});

// @desc    Find available classrooms
// @route   POST /api/classrooms/available
// @access  Private
const findAvailableClassrooms = asyncHandler(async (req, res) => {
  const { date, startTime, endTime, minCapacity, alternateSeating } = req.body;

  if (!date || !startTime || !endTime) {
    return res.status(400).json({
      success: false,
      message: 'Date, start time, and end time are required',
    });
  }

  const requiredCapacity = alternateSeating ? minCapacity * 2 : minCapacity;

  const availableClassrooms = await Classroom.findAvailable(
    date,
    startTime,
    endTime,
    requiredCapacity,
  );

  res.json({
    success: true,
    count: availableClassrooms.length,
    data: availableClassrooms.map(classroom => ({
      ...classroom.toObject(),
      effectiveCapacity: alternateSeating ? classroom.alternateCapacity : classroom.capacity,
    })),
  });
});

// @desc    Book classroom
// @route   POST /api/classrooms/:id/book
// @access  Private
const bookClassroom = asyncHandler(async (req, res) => {
  const { date, startTime, endTime, purpose } = req.body;

  const classroom = await Classroom.findById(req.params.id);

  if (!classroom) {
    return res.status(404).json({
      success: false,
      message: 'Classroom not found',
    });
  }

  // Check if classroom is available
  if (!classroom.isAvailableForSlot(date, startTime, endTime)) {
    return res.status(400).json({
      success: false,
      message: 'Classroom is already booked for this time slot',
    });
  }

  // Add booking
  classroom.bookedSlots.push({
    date: new Date(date),
    startTime,
    endTime,
    purpose,
    bookedBy: req.user._id,
    bookedByModel: 'User',
  });

  await classroom.save();

  res.json({
    success: true,
    message: 'Classroom booked successfully',
    data: classroom,
  });
});

// @desc    Update classroom
// @route   PATCH /api/classrooms/:id
// @access  Private (Admin)
const updateClassroom = asyncHandler(async (req, res) => {
  const classroom = await Classroom.findById(req.params.id);

  if (!classroom) {
    return res.status(404).json({
      success: false,
      message: 'Classroom not found',
    });
  }

  const updatedClassroom = await Classroom.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true },
  );

  res.json({
    success: true,
    message: 'Classroom updated successfully',
    data: updatedClassroom,
  });
});

// @desc    Delete classroom
// @route   DELETE /api/classrooms/:id
// @access  Private (Admin)
const deleteClassroom = asyncHandler(async (req, res) => {
  const classroom = await Classroom.findById(req.params.id);

  if (!classroom) {
    return res.status(404).json({
      success: false,
      message: 'Classroom not found',
    });
  }

  await classroom.remove();

  res.json({
    success: true,
    message: 'Classroom deleted successfully',
  });
});

// @desc    Get classroom bookings
// @route   GET /api/classrooms/:id/bookings
// @access  Private
const getClassroomBookings = asyncHandler(async (req, res) => {
  const classroom = await Classroom.findById(req.params.id)
    .populate('bookedSlots.bookedBy', 'fullName email');

  if (!classroom) {
    return res.status(404).json({
      success: false,
      message: 'Classroom not found',
    });
  }

  res.json({
    success: true,
    data: {
      roomNumber: classroom.roomNumber,
      building: classroom.building,
      bookings: classroom.bookedSlots,
    },
  });
});

// @desc    Bulk upload classrooms
// @route   POST /api/classrooms/bulk-upload
// @access  Private (Admin)
const bulkUploadClassrooms = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'Please upload a CSV file',
    });
  }

  const results = [];
  const errors = [];
  const { normalizeClassroomHeader, trimRowValues } = require('../utils/csvNormalize');

  // Read CSV file with header normalization
  fs.createReadStream(req.file.path)
    .pipe(csv({ mapHeaders: ({ header }) => normalizeClassroomHeader(header) }))
    .on('data', (data) => {
      const cleaned = trimRowValues(data);

      // Validate required fields
      const requiredFields = ['roomNumber', 'building', 'capacity'];
      const missingFields = requiredFields.filter(field => !cleaned[field]);

      if (missingFields.length > 0) {
        errors.push({
          row: cleaned,
          error: `Missing required fields: ${missingFields.join(', ')}`,
        });
        return;
      }

      // Normalize and validate data
      const roomNumber = String(cleaned.roomNumber).trim();
      const building = String(cleaned.building).trim();
      const floor = cleaned.floor ? parseInt(cleaned.floor) : 1;
      const capacity = parseInt(cleaned.capacity) || 60;
      const type = cleaned.type || 'Classroom';
      const validTypes = ['Classroom', 'Lab', 'Lecture Theatre', 'Seminar Hall'];
      const finalType = validTypes.includes(type) ? type : 'Classroom';

      // Parse and validate facilities (comma-separated string or array)
      let facilities = [];
      const validFacilities = ['Projector', 'AC', 'Microphone', 'Smart Board', 'WiFi', 'Computers'];
      
      // Mapping for common facility name variations
      const facilityMapping = {
        'projector': 'Projector',
        'ac': 'AC',
        'air conditioning': 'AC',
        'airconditioning': 'AC',
        'microphone': 'Microphone',
        'mic': 'Microphone',
        'smart board': 'Smart Board',
        'smartboard': 'Smart Board',
        'whiteboard': 'Smart Board',
        'wifi': 'WiFi',
        'wi-fi': 'WiFi',
        'wireless': 'WiFi',
        'internet': 'WiFi',
        'computers': 'Computers',
        'computer': 'Computers',
        'pc': 'Computers',
        'laptop': 'Computers',
        // Common invalid values to ignore or map
        'green board': null, // Ignore green board (not in enum)
        'green': null,
        'blackboard': null,
        'chalkboard': null,
        'board': null,
      };
      
      if (cleaned.facilities) {
        let rawFacilities = [];
        if (typeof cleaned.facilities === 'string') {
          rawFacilities = cleaned.facilities.split(',').map(f => f.trim()).filter(Boolean);
        } else if (Array.isArray(cleaned.facilities)) {
          rawFacilities = cleaned.facilities;
        }
        
        // Map and validate facilities
        const mappedFacilities = new Set();
        for (const facility of rawFacilities) {
          const normalized = facility.toLowerCase().trim();
          const mapped = facilityMapping[normalized];
          
          if (mapped) {
            // Valid mapped facility
            mappedFacilities.add(mapped);
          } else if (validFacilities.includes(facility)) {
            // Already valid (case-sensitive match)
            mappedFacilities.add(facility);
          } else if (validFacilities.some(vf => vf.toLowerCase() === normalized)) {
            // Case-insensitive match
            const matched = validFacilities.find(vf => vf.toLowerCase() === normalized);
            mappedFacilities.add(matched);
          }
          // Ignore invalid facilities (like "Green Board") silently
        }
        
        facilities = Array.from(mappedFacilities);
      }

      // Calculate seating layout
      const rows = cleaned.rows ? parseInt(cleaned.rows) : Math.ceil(Math.sqrt(capacity));
      const seatsPerRow = cleaned.seatsPerRow ? parseInt(cleaned.seatsPerRow) : Math.ceil(capacity / rows);
      const totalSeats = rows * seatsPerRow;

      // Validate capacity
      if (capacity < 1 || capacity > 1000) {
        errors.push({
          row: cleaned,
          error: 'Capacity must be between 1 and 1000',
        });
        return;
      }

      results.push({
        roomNumber,
        building,
        floor,
        capacity,
        type: finalType,
        facilities,
        seatingLayout: {
          rows,
          seatsPerRow,
          totalSeats,
        },
      });
    })
    .on('end', async () => {
      try {
        const success = [];
        const failed = [];

        // Insert classrooms one by one to handle duplicates
        for (const classroomData of results) {
          try {
            // Check if classroom already exists
            const existing = await Classroom.findOne({ roomNumber: classroomData.roomNumber });
            if (existing) {
              failed.push({
                data: classroomData,
                error: `Classroom with room number ${classroomData.roomNumber} already exists`,
              });
              continue;
            }

            const classroom = await Classroom.create(classroomData);
            success.push(classroom);
          } catch (error) {
            failed.push({
              data: classroomData,
              error: error.message || 'Failed to create classroom',
            });
          }
        }

        // Clean up uploaded file
        if (fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }

        res.json({
          success: true,
          message: 'Bulk upload completed',
          data: {
            totalProcessed: results.length,
            successful: success.length,
            failed: failed.length + errors.length,
            errors: [...errors, ...failed],
          },
        });
      } catch (error) {
        // Clean up uploaded file
        if (fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }

        res.status(500).json({
          success: false,
          message: 'Error processing bulk upload',
          error: error.message,
        });
      }
    })
    .on('error', (error) => {
      // Clean up uploaded file
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }

      res.status(500).json({
        success: false,
        message: 'Error reading CSV file',
        error: error.message,
      });
    });
});

module.exports = {
  createClassroom,
  getClassrooms,
  getClassroom,
  getAllClassroomsForAssignment,
  findAvailableClassrooms,
  bookClassroom,
  updateClassroom,
  deleteClassroom,
  getClassroomBookings,
  bulkUploadClassrooms,
};

