const mongoose = require('mongoose');

const classroomSchema = new mongoose.Schema({
  roomNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  building: {
    type: String,
    required: true,
    trim: true,
  },
  floor: {
    type: Number,
    required: true,
  },
  capacity: {
    type: Number,
    required: true,
    min: 1,
  },
  type: {
    type: String,
    enum: ['Classroom', 'Lab', 'Lecture Theatre', 'Seminar Hall'],
    default: 'Classroom',
  },
  facilities: [{
    type: String,
    enum: ['Projector', 'AC', 'Microphone', 'Smart Board', 'WiFi', 'Computers'],
  }],
  seatingLayout: {
    rows: {
      type: Number,
      required: true,
    },
    seatsPerRow: {
      type: Number,
      required: true,
    },
    totalSeats: {
      type: Number,
      required: true,
    },
  },
  isAvailable: {
    type: Boolean,
    default: true,
  },
  bookedSlots: [{
    date: Date,
    startTime: String,
    endTime: String,
    purpose: String,
    bookedBy: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'bookedSlots.bookedByModel',
    },
    bookedByModel: {
      type: String,
      enum: ['User', 'Teacher'],
    },
  }],
  metadata: {
    lastMaintenance: Date,
    maintenanceNotes: String,
  },
}, {
  timestamps: true,
});

// Virtual for effective capacity (considering alternate seating)
classroomSchema.virtual('alternateCapacity').get(function () {
  return Math.floor(this.capacity / 2);
});

// Method to check if classroom is available for a time slot
classroomSchema.methods.isAvailableForSlot = function (date, startTime, endTime) {
  const targetDate = new Date(date).toDateString();

  for (const slot of this.bookedSlots) {
    const slotDate = new Date(slot.date).toDateString();

    if (slotDate === targetDate) {
      // Check time overlap
      if (this.timeOverlaps(startTime, endTime, slot.startTime, slot.endTime)) {
        return false;
      }
    }
  }

  return true;
};

// Helper method to check time overlap
classroomSchema.methods.timeOverlaps = function (start1, end1, start2, end2) {
  const s1 = this.parseTime(start1);
  const e1 = this.parseTime(end1);
  const s2 = this.parseTime(start2);
  const e2 = this.parseTime(end2);

  return s1 < e2 && e1 > s2;
};

// Helper to parse time string to minutes
classroomSchema.methods.parseTime = function (timeStr) {
  const [time, period] = timeStr.split(' ');
  let [hours, minutes] = time.split(':').map(Number);

  if (period === 'PM' && hours !== 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;

  return hours * 60 + minutes;
};

// Static method to find available classrooms
classroomSchema.statics.findAvailable = async function (date, startTime, endTime, minCapacity) {
  const classrooms = await this.find({
    isAvailable: true,
    capacity: { $gte: minCapacity },
  });

  return classrooms.filter(classroom =>
    classroom.isAvailableForSlot(date, startTime, endTime),
  );
};

module.exports = mongoose.model('Classroom', classroomSchema);
