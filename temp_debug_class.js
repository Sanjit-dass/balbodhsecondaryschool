const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.resolve('server/.env') });
const mongoose = require('mongoose');
const Exam = require('./server/src/models/Exam');
const ClassModel = require('./server/src/models/Class');
const Student = require('./server/src/models/Student');
const Subject = require('./server/src/models/Subject');
const ExamMarks = require('./server/src/models/ExamMarks');
(async () => {
  try {
    const uri = process.env.MONGODB_URL || process.env.MONGODB_URI;
    console.log('URI loaded?', !!uri);
    await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    const classes = await ClassModel.find().lean();
    console.log('classes:', classes.map(c => ({ id: c._id.toString(), name: c.name, numeric: c.numeric })).slice(0,20));
    const examList = await Exam.find().populate('class', 'name').lean();
    console.log('exams total', examList.length);
    const exam10 = examList.filter(e => e.class?.name === '10');
    console.log('class 10 exams count', exam10.length, exam10.map(e => ({ id: e._id.toString(), title: e.title, class: e.class?.name })));
    const students10 = await Student.find({ $or: [{ className: '10' }, { class: exam10[0]?.class?._id : null }] }).lean();
    console.log('students10 count', students10.length);
    if (students10.length) console.log('student10 example', { id: students10[0]._id.toString(), admissionNumber: students10[0].admissionNumber, fullName: students10[0].fullName, class: students10[0].class?.toString(), className: students10[0].className });
    const subjects10 = await Subject.find({ class: '10' }).lean();
    console.log('subjects10 count', subjects10.length, subjects10.map(s => ({ id: s._id.toString(), name: s.name, class: s.class })).slice(0,20));
    const examSubjectIds = exam10.flatMap(e => (e.subjects || []).map(s => s.toString()));
    console.log('exam10 subjectIds', [...new Set(examSubjectIds)]);
    await mongoose.disconnect();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();