import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import TeacherMarksEntry from '../../components/TeacherMarksEntry';

const EXAM_TYPES = [
  'First Terminal Exam',
  'Second Terminal Exam',
  'Third Terminal Exam',
  'Final Exam'
];

const CLASS_OPTIONS = ['Nursery', 'LKG', 'UKG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];

function normalizeClassName(value) {
  if (!value && value !== 0) return '';
  return String(value).trim().toLowerCase().replace(/^class\s+/i, '').replace(/\s+/g, '');
}

function normalizeTeacherId(value) {
  if (!value && value !== 0) return '';
  return String(value).trim().toLowerCase();
}

function normalizeClassEntry(cls) {
  if (!cls) return null;
  const id = cls?._id || cls?.id || cls;
  if (!id) return null;
  return {
    _id: String(id),
    id: String(id),
    name: String(cls?.name || cls?.className || id || '').trim() || String(id)
  };
}

function normalizeSubjectEntry(subject, classId) {
  if (!subject) return null;

  const maybeId = subject?._id || subject?.id;
  const rawId = typeof maybeId === 'string' || typeof maybeId === 'number' ? maybeId : undefined;
  let name = '';

  if (subject && typeof subject.name === 'string' && subject.name.trim()) {
    name = subject.name.trim();
  } else if (subject && typeof subject.subjectName === 'string' && subject.subjectName.trim()) {
    name = subject.subjectName.trim();
  } else if (subject && typeof subject.subject === 'string' && subject.subject.trim()) {
    name = subject.subject.trim();
  } else if (typeof subject === 'string' && subject.trim()) {
    name = subject.trim();
  }

  if (!name && rawId) {
    name = String(rawId).trim();
  }

  if (!name) return null;

  const id = rawId ? String(rawId).trim() : `${name}${classId ? `-${classId}` : ''}`;
  if (!id || id === '[object Object]') return null;

  const normalizedName = String(name).trim();
  if (!normalizedName || normalizedName === '[object Object]') return null;

  return {
    _id: id,
    id,
    name: normalizedName,
    classId: classId ? String(classId) : undefined
  };
}

function dedupeClasses(classes) {
  const map = new Map();
  (classes || []).forEach((cls) => {
    const entry = normalizeClassEntry(cls);
    if (!entry) return;
    map.set(String(entry._id), entry);
  });
  return Array.from(map.values());
}

function dedupeSubjects(subjects) {
  const map = new Map();
  (subjects || []).forEach((subject) => {
    const classId = subject?.classId || subject?.class?._id || subject?.class;
    const entry = normalizeSubjectEntry(subject, classId);
    if (!entry) return;
    const subjectKey = String(entry.name || '').trim().toLowerCase();
    if (!subjectKey) return;
    const key = `${entry.classId || 'default'}::${subjectKey}`;
    if (!map.has(key)) {
      map.set(key, entry);
    }
  });
  return Array.from(map.values());
}

export default function TeacherMarksEntryPage() {
  const navigate = useNavigate();
  const [examType, setExamType] = useState(EXAM_TYPES[0]);
  const [selectedClass, setSelectedClass] = useState('');
  const [exams, setExams] = useState([]);
  const [selectedExam, setSelectedExam] = useState(null);
  const [loadingExams, setLoadingExams] = useState(false);
  const [message, setMessage] = useState('');
  const [teacherAssignments, setTeacherAssignments] = useState({ classes: [], subjects: [] });
  const classOptions = CLASS_OPTIONS.map(name => ({ _id: name, name }));
  
  // Teacher verification states
  const [teachers, setTeachers] = useState([]);
  const [selectedTeacher, setSelectedTeacher] = useState('');
  const [teacherIdInput, setTeacherIdInput] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const [verificationError, setVerificationError] = useState('');
  const [loadingTeachers, setLoadingTeachers] = useState(false);

  useEffect(() => {
    loadTeachers();
  }, []);

  useEffect(() => {
    if (isVerified) {
      loadTeacherAssignments();
    }
  }, [isVerified]);

  useEffect(() => {
    if (isVerified) {
      loadExams();
    }
  }, [examType, selectedClass, teacherAssignments, isVerified]);

  useEffect(() => {
    if (!selectedClass && isVerified) {
      if (teacherAssignments.classes && teacherAssignments.classes.length > 0) {
        setSelectedClass(teacherAssignments.classes[0]._id);
      } else if (classOptions.length > 0) {
        setSelectedClass(classOptions[0]._id);
      }
    }
  }, [teacherAssignments, selectedClass, isVerified, classOptions]);

  const loadTeachers = async () => {
    try {
      setLoadingTeachers(true);
      console.log('Loading teachers...');
      const res = await api.get('/teachers');
      console.log('Teachers API response:', res.data);
      
      // Handle different response formats
      let teachersData = [];
      if (Array.isArray(res.data)) {
        teachersData = res.data;
      } else if (res.data?.teachers && Array.isArray(res.data.teachers)) {
        teachersData = res.data.teachers;
      } else if (res.data?.data && Array.isArray(res.data.data)) {
        teachersData = res.data.data;
      }
      
      console.log('Processed teachers data:', teachersData);
      setTeachers(teachersData);
      
      if (teachersData.length === 0) {
        setVerificationError('No teachers found in the system');
      }
    } catch (err) {
      console.error('Error loading teachers:', err);
      setVerificationError('Failed to load teachers. Please check your connection.');
    } finally {
      setLoadingTeachers(false);
    }
  };

  const handleVerifyTeacher = async () => {
    setVerificationError('');
    setMessage('');
    
    if (!selectedTeacher) {
      setVerificationError('Please select a teacher name');
      return;
    }
    
    if (!teacherIdInput.trim()) {
      setVerificationError('Please enter your Teacher ID');
      return;
    }

    try {
      const teacher = teachers.find(t => String(t._id) === String(selectedTeacher));
      if (!teacher) {
        setVerificationError('Teacher not found');
        return;
      }

      const inputId = teacherIdInput.trim();
      const teacherEmployeeId = teacher.employeeId ? String(teacher.employeeId).trim() : '';

      // Check if input matches teacher's employeeId
      if (teacherEmployeeId && teacherEmployeeId === inputId) {
        setIsVerified(true);
        setMessage('Teacher verified successfully');
        setTimeout(() => setMessage(''), 3000);
        return;
      }

      // If not matching, show error
      setVerificationError('Invalid Teacher ID. Please check your ID and try again.');
    } catch (err) {
      console.error(err);
      setVerificationError('Teacher verification failed. Please try again.');
    }
  };

  const buildAssignmentsFromMarks = (teacherMarks) => {
    const classesList = [];
    const subjectsList = [];

    teacherMarks.forEach((mark) => {
      const classObj = mark.class || {};
      const classId = classObj._id || classObj;
      const className = classObj.name || classObj.className || classObj;
      const normalizedClass = normalizeClassEntry({ _id: classId, name: className });
      if (normalizedClass) {
        classesList.push(normalizedClass);
      }

      const subjectObj = mark.subject || mark.subjectName || {};
      const normalizedSubject = normalizeSubjectEntry(subjectObj, classId);
      if (normalizedSubject) {
        subjectsList.push(normalizedSubject);
      }
    });

    return {
      classes: dedupeClasses(classesList),
      subjects: dedupeSubjects(subjectsList)
    };
  };

  const loadTeacherAssignments = async () => {
    try {
      console.log('Loading assignments for teacher:', selectedTeacher);
      const teacher = teachers.find(t => String(t._id) === String(selectedTeacher));
      
      if (!teacher) {
        setVerificationError('Teacher not found');
        return;
      }

      console.log('Teacher found:', teacher);
      console.log('Teacher employeeId:', teacher.employeeId);

      const res = await api.get('/exams/teacher/assignments', {
        params: { teacherId: teacher.employeeId || selectedTeacher }
      });
      console.log('Assignments API response:', res.data);

      const assignmentData = res.data || {};
      let classes = Array.isArray(assignmentData.classes) ? assignmentData.classes : [];
      let subjects = Array.isArray(assignmentData.subjects) ? assignmentData.subjects : [];

      if (classes.length === 0 || subjects.length === 0) {
        console.warn('No active assignment data found via /exams/teacher/assignments, trying fallback teacher assignments endpoint');
        const fallbackRes = await api.get('/teacher-subject-assignments/my-assignments', {
          params: {
            teacherId: teacher.employeeId || teacher._id || selectedTeacher
          }
        });
        const fallbackAssignments = Array.isArray(fallbackRes.data) ? fallbackRes.data : [];
        if (fallbackAssignments.length > 0) {
          const classesList = [];
          const subjectsList = [];

          fallbackAssignments.forEach((assignment) => {
            const classId = assignment.class?._id || assignment.class;
            const normalizedClass = normalizeClassEntry({ _id: classId, name: assignment.class?.name || assignment.className });
            if (normalizedClass) {
              classesList.push(normalizedClass);
            }

            const assignmentSubjects = Array.isArray(assignment.subjects) ? assignment.subjects : [];
            assignmentSubjects.forEach((sub) => {
              const normalized = normalizeSubjectEntry(sub, classId);
              if (normalized) subjectsList.push(normalized);
            });

            const subjectNames = Array.isArray(assignment.subjectNames) ? assignment.subjectNames : [];
            subjectNames.forEach((name) => {
              const normalized = normalizeSubjectEntry({ name }, classId);
              if (normalized) subjectsList.push(normalized);
            });
          });

          classes = dedupeClasses(classesList);
          subjects = dedupeSubjects(subjectsList);
        }
      }

      if (classes.length === 0 || subjects.length === 0) {
        console.warn('No assignment data found, falling back to previously entered marks');
        const marksRes = await api.get('/exams/teacher/my-marks');
        const teacherMarks = Array.isArray(marksRes.data.marks) ? marksRes.data.marks : [];
        const fallback = buildAssignmentsFromMarks(teacherMarks);
        classes = fallback.classes;
        subjects = fallback.subjects;
      }

      if (classes.length === 0 || subjects.length === 0) {
        setVerificationError('No assignments or previously entered marks found. Please contact admin.');
        return;
      }

      setTeacherAssignments({ classes: dedupeClasses(classes), subjects: dedupeSubjects(subjects) });
      if (!selectedClass && classes.length > 0) {
        setSelectedClass(classes[0]._id);
      }
    } catch (err) {
      console.error('Error loading assignments:', err);
      setVerificationError(err?.response?.data?.message || 'Failed to load your assignments. Please contact admin.');
    }
  };

  const loadExams = async () => {
    if (!examType) return;
    setLoadingExams(true);
    try {
      const res = await api.get('/exams');
      const allExams = res.data.exams || [];
      let filtered = allExams.filter(e => e.type === examType);
      const teacherClassNames = new Set((teacherAssignments.classes || []).map(cls => normalizeClassName(cls.name || cls._id)));

      if (selectedClass) {
        const selectedKey = normalizeClassName(selectedClass);
        filtered = filtered.filter(e => {
          const examClassId = typeof e.class === 'string' ? e.class : (e.class?._id || '');
          const examClassName = typeof e.class === 'string' ? (e.className || e.class) : (e.class?.name || '');
          return normalizeClassName(examClassId) === selectedKey || normalizeClassName(examClassName) === selectedKey;
        });
      } else if (teacherClassNames.size > 0) {
        filtered = filtered.filter(e => {
          const examClassId = typeof e.class === 'string' ? e.class : (e.class?._id || '');
          const examClassName = typeof e.class === 'string' ? (e.className || e.class) : (e.class?.name || '');
          return teacherClassNames.has(normalizeClassName(examClassId)) || teacherClassNames.has(normalizeClassName(examClassName));
        });
      }

      setExams(filtered);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingExams(false);
    }
  };

  const handleProceed = () => {
    if (!selectedExam) {
      alert('Please select an exam');
      return;
    }
  };

  const handleReset = () => {
    setIsVerified(false);
    setSelectedTeacher('');
    setTeacherIdInput('');
    setVerificationError('');
    setMessage('');
    setTeacherAssignments({ classes: [], subjects: [] });
    setSelectedClass('');
    setSelectedExam(null);
  };

  const selectedTeacherObj = teachers.find(t => String(t._id) === String(selectedTeacher));

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Teacher Marks Entry</h1>

      {!isVerified ? (
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-6 max-w-2xl">
          <h2 className="text-xl font-semibold mb-6 text-slate-900">Teacher Verification</h2>
          
          {message && (
            <div className="mb-4 p-4 rounded-lg bg-green-50 border border-green-200 text-green-700">
              {message}
            </div>
          )}

          {verificationError && (
            <div className="mb-4 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700">
              {verificationError}
            </div>
          )}

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Teacher Name</label>
              <select
                value={selectedTeacher}
                onChange={(e) => setSelectedTeacher(e.target.value)}
                disabled={loadingTeachers}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all disabled:opacity-50"
              >
                <option value="">Select Teacher</option>
                {Array.isArray(teachers) && teachers.map((teacher) => (
                  <option key={teacher._id} value={teacher._id}>
                    {teacher.fullName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Teacher ID</label>
              <input
                type="text"
                value={teacherIdInput}
                onChange={(e) => setTeacherIdInput(e.target.value)}
                placeholder="Enter your Teacher ID (e.g., TCH001)"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
              />
            </div>

            <button
              onClick={handleVerifyTeacher}
              disabled={loadingTeachers || !selectedTeacher || !teacherIdInput.trim()}
              className="w-full px-6 py-2.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loadingTeachers ? 'Loading...' : 'Verify & Proceed'}
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-sm text-slate-600">
                <span className="font-medium">Verified Teacher:</span> {teachers.find(t => t._id === selectedTeacher)?.fullName}
              </span>
              <span className="text-sm text-slate-600">
                <span className="font-medium">Teacher ID:</span> {teacherIdInput}
              </span>
            </div>
            <button
              onClick={handleReset}
              className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors text-sm font-medium"
            >
              Change Teacher
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-3 mb-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Select Exam Type</label>
              <select 
                value={examType} 
                onChange={e => setExamType(e.target.value)} 
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              >
                {EXAM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Select Class</label>
              <select 
                value={selectedClass} 
                onChange={e => setSelectedClass(e.target.value)} 
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              >
                <option value="">All Classes</option>
                {(teacherAssignments.classes?.length > 0 ? teacherAssignments.classes : classOptions).map(cls => (
                  <option key={cls._id} value={cls._id}>{cls.name || cls._id || 'Class'}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Select Exam</label>
              <select 
                value={selectedExam?._id || ''} 
                onChange={e => setSelectedExam(exams.find(ex => ex._id === e.target.value))}
                disabled={loadingExams || exams.length === 0}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg disabled:opacity-50"
              >
                <option value="">Select an exam</option>
                {exams.map(e => (
                  <option key={e._id} value={e._id}>{e.title || e.type}</option>
                ))}
              </select>
            </div>
          </div>

          {message && <div className="mb-4 p-3 bg-green-100 text-green-700 rounded">{message}</div>}

          {selectedExam ? (
            <div>
              <h2 className="text-lg font-semibold mb-2">Exam: {selectedExam.title || selectedExam.type}</h2>
              <TeacherMarksEntry 
                examId={selectedExam._id} 
                exam={selectedExam} 
                teacherAssignments={teacherAssignments}
                teacherId={selectedTeacherObj?.employeeId || selectedTeacher}
              />
            </div>
          ) : (
            <div className="text-sm text-slate-500">
              Select exam type and exam to load your assigned subjects and enter marks.
            </div>
          )}
        </>
      )}
    </div>
  );
}
