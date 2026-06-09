const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.resolve('server/.env') });
const mongoose = require('mongoose');
const Student = require('./server/src/models/Student');
const ClassModel = require('./server/src/models/Class');
(async () => {
  try {
    const uri = process.env.MONGODB_URL || process.env.MONGODB_URI;
    if (!uri) { console.error('No MONGODB_URL'); process.exit(1); }
    await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    const classCounts = await Student.aggregate([
      { $match: { $or: [ { class: { $exists: true, $ne: null } }, { className: { $exists: true, $ne: null } } ] } },
      { $group: { _id: { class: '$class', className: '$className' }, count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 50 }
    ]);
    console.log('Student class aggregates:', classCounts.map(c => ({ class: c._id.class ? c._id.class.toString() : null, className: c._id.className, count: c.count })));
    const classDocs = await ClassModel.find().lean();
    console.log('Class docs:', classDocs.map(c => ({ id: c._id.toString(), name: c.name, numeric: c.numeric })));
    const sampleStudents = await Student.find({ $or: [ { className: '10' }, { className: '10th' }, { className: 'Class 10' }, { className: 'X' }, { className: 'x' } ] }).limit(20).lean();
    console.log('Sample students matching likely 10 class names:', sampleStudents.map(s => ({ id: s._id.toString(), admissionNumber: s.admissionNumber, fullName: s.fullName, class: s.class?.toString(), className: s.className })));
    await mongoose.disconnect();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();