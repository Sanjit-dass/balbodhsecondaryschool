const mongoose = require('mongoose');

const TeacherSubjectAssignmentSchema = new mongoose.Schema({
  teacher: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Teacher',
    required: true
  },
  teacherName: { 
    type: String, 
    required: true 
  },
  teacherId: { 
    type: String, 
    required: true 
  },
  class: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Class',
    required: true
  },
  className: { 
    type: String, 
    required: true 
  },
  subjects: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject'
  }],
  subjectNames: [{
    type: String
  }],
  academicYear: { 
    type: String, 
    required: true 
  },
  status: { 
    type: String, 
    enum: ['active', 'inactive'], 
    default: 'active' 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
});

TeacherSubjectAssignmentSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

// Index for efficient queries
TeacherSubjectAssignmentSchema.index({ teacherId: 1, academicYear: 1 });
TeacherSubjectAssignmentSchema.index({ teacherId: 1, class: 1, academicYear: 1 });

module.exports = mongoose.model('TeacherSubjectAssignment', TeacherSubjectAssignmentSchema);
