const dotenv = require('dotenv');
dotenv.config();
const mongoose = require('mongoose');
const Student = require('./src/models/Student');
const Class = require('./src/models/Class');
const MONGODB_URL = process.env.MONGODB_URL || process.env.MONGODB_URI;
if (!MONGODB_URL) {
  console.error('Missing MongoDB URL');
  process.exit(1);
}
(async () => {
  try {
    await mongoose.connect(MONGODB_URL, { useNewUrlParser: true, useUnifiedTopology: true });
    const classes = await Class.find({ $or: [ { numeric: 10 }, { name: /10/i }, { name: /Class\\s*10/i } ] }).lean();
    console.log('Class docs for 10:', classes.map((c) => ({ id: c._id.toString(), name: c.name, numeric: c.numeric })));
    const classIds = classes.map((c) => c._id);
    const countByFilter = {};
    countByFilter.className10 = await Student.countDocuments({ className: { $in: ['10', 'Class 10', '10th', 'class 10'] } });
    countByFilter.class10regex = await Student.countDocuments({ className: /^(?:class\\s*)?10(?:th)?$/i });
    countByFilter.classIdMatch = classIds.length ? await Student.countDocuments({ class: { $in: classIds } }) : 0;
    countByFilter.classAny = await Student.countDocuments({ $or: [{ className: /10/i }, { class: { $in: classIds } }] });
    console.log('Counts:', countByFilter);
    const samples = await Student.find({ $or: [{ className: /^(?:class\\s*)?10(?:th)?$/i }, { class: { $in: classIds } }] }).limit(20).lean();
    console.log('Sample student records (max 20):');
    samples.forEach((s) => {
      console.log({ id: s._id.toString(), name: s.name || s.fullName, rollNumber: s.rollNumber, admissionNumber: s.admissionNumber, class: s.class, className: s.className });
    });
  } catch (err) {
    console.error('ERR', err);
  } finally {
    await mongoose.disconnect();
  }
})();
