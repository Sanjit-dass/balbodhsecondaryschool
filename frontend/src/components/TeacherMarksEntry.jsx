import React, { useEffect, useState } from 'react';
import api from '../services/api';

export default function TeacherMarksEntry({ examId, exam, teacherAssignments, teacherId }) {
  const [assignments, setAssignments] = useState({ subjects: [], classes: [] });
  const [selectedClass, setSelectedClass] = useState('');
  const [students, setStudents] = useState([]);
  const [classSubjects, setClassSubjects] = useState([]);
  const [marksMatrix, setMarksMatrix] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    loadAssignments();
  }, [teacherAssignments, examId]);

  useEffect(() => {
    if (!examId) return;
    setSelectedClass('');
    setStudents([]);
    setMarksMatrix([]);
  }, [examId]);

  const loadClassSubjects = async () => {
    if (!selectedClass) {
      setClassSubjects([]);
      return;
    }
    try {
      const res = await api.get(`/exams/teacher/subjects/${selectedClass}`, {
        params: { teacherId }
      });
      const subjects = Array.isArray(res.data.subjects) ? res.data.subjects : [];
      setClassSubjects(subjects.map(subject => ({
        _id: subject._id || String(subject.name || subject.id || subject),
        id: subject._id || String(subject.name || subject.id || subject),
        name: String(subject.name || subject.subjectName || subject.name || subject || '').trim(),
        classId: selectedClass
      })).filter(sub => sub._id && sub.name));
    } catch (err) {
      console.warn('Unable to load class-specific subjects:', err?.response?.data?.message || err.message);
      setClassSubjects([]);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      if (!selectedClass) {
        setStudents([]);
        setMarksMatrix([]);
        setClassSubjects([]);
        return;
      }

      try {
        await loadClassSubjects();
        const studentsData = await loadStudents();
        await loadMarks(studentsData || []);
      } catch (err) {
        console.error(err);
      }
    };

    loadData();
  }, [selectedClass, examId]);

  const dedupeClasses = (classes) => {
    const map = new Map();
    return (classes || []).reduce((acc, cls) => {
      if (!cls || !cls._id || !cls.name) return acc;
      const key = String(cls._id);
      if (!map.has(key)) {
        map.set(key, true);
        acc.push({ _id: String(cls._id), id: String(cls.id || cls._id), name: String(cls.name).trim() });
      }
      return acc;
    }, []);
  };

  const dedupeSubjects = (subjects) => {
    const map = new Map();
    return (subjects || []).reduce((acc, subject) => {
      if (!subject || !subject.name) return acc;
      const id = subject._id ? String(subject._id).trim() : String(subject.id || '').trim();
      const name = String(subject.name).trim();
      if (!name || name === '[object Object]') return acc;
      const key = `${subject.classId || 'default'}::${name.toLowerCase()}`;
      if (!map.has(key)) {
        map.set(key, true);
        acc.push({ _id: id || name, id: id || name, name, classId: subject.classId ? String(subject.classId) : undefined });
      }
      return acc;
    }, []);
  };

  const normalizeSubjects = (subjects) => {
    return (subjects || []).map((subject) => {
      if (!subject) return null;
      const rawId = subject._id || subject.id;
      const id = rawId ? String(rawId).trim() : undefined;
      const name = String(subject.name || subject.subjectName || subject.subject || subject || '').trim();
      if (!name || name === '[object Object]') return null;
      const finalId = id || name;
      if (!finalId || finalId === '[object Object]') return null;
      return { _id: finalId, id: finalId, name, classId: subject.classId ? String(subject.classId) : undefined };
    }).filter(Boolean);
  };

  const loadAssignments = async () => {
    try {
      setLoading(true);
      setError('');

      console.log('TeacherMarksEntry - teacherAssignments:', teacherAssignments);

      if (teacherAssignments && Array.isArray(teacherAssignments.classes) && Array.isArray(teacherAssignments.subjects)) {
        console.log('Using passed assignments:', teacherAssignments);
        const cleanClasses = dedupeClasses(teacherAssignments.classes);
        const cleanSubjects = dedupeSubjects(normalizeSubjects(teacherAssignments.subjects));

        setAssignments({
          classes: cleanClasses,
          subjects: cleanSubjects
        });
        setError('');

        if (cleanClasses.length === 1) {
          setSelectedClass(cleanClasses[0]._id);
        }

        setLoading(false);
        return;
      }

      // If no assignments passed, show error
      console.log('No assignments provided');
      setError('No assignments provided. Please verify your teacher identity first.');
      setLoading(false);
    } catch (err) {
      console.error('Error loading assignments:', err);
      setError('Failed to load your assignments. Please contact admin.');
      setLoading(false);
    }
  };

  const getFilteredSubjects = () => {
    const validSubjects = dedupeSubjects(assignments.subjects || []).filter(subject =>
      subject && subject._id && typeof subject.name === 'string' && subject.name.trim() && subject.name !== '[object Object]'
    );

    if (classSubjects && classSubjects.length > 0) {
      return dedupeSubjects(classSubjects);
    }

    if (!selectedClass) return validSubjects;

    const classSpecificSubjects = validSubjects.filter(sub =>
      String(sub.classId) === String(selectedClass)
    );

    if (classSpecificSubjects.length > 0) {
      return classSpecificSubjects;
    }

    return validSubjects;
  };

  const filteredSubjects = getFilteredSubjects();

  const loadStudents = async () => {
    if (!selectedClass) return [];
    try {
      const res = await api.get(`/exams/teacher/students/${selectedClass}`, {
        params: { teacherId }
      });
      const studentList = res.data.students || [];
      setStudents(studentList);
      return studentList;
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.message || 'Failed to load students.');
      return [];
    }
  };

  const loadMarks = async (studentsList = []) => {
    if (!selectedClass) {
      setMarksMatrix([]);
      return;
    }

    try {
      const res = await api.get(`/exams/teacher/${examId}/marks`, {
        params: {
          classId: selectedClass,
          teacherId
        }
      });
      const marksList = res.data.marks || [];
      const subjectColumns = filteredSubjects;
      if (selectedClass && subjectColumns.length === 0) {
        setMarksMatrix([]);
        return;
      }

      const marksMap = {};
      marksList.forEach(mark => {
        const studentKey = mark.student?._id || mark.student;
        const subjectKey = mark.subject?._id || mark.subject;
        if (studentKey && subjectKey) {
          marksMap[studentKey] = marksMap[studentKey] || {};
          marksMap[studentKey][subjectKey] = mark;
        }
      });

      const formattedMatrix = (studentsList || []).map(student => ({
        studentId: student._id,
        studentName: student.user?.name || student.fullName || 'N/A',
        rollNumber: student.admissionNumber || student.rollNumber || '',
        subjects: subjectColumns.map(subject => {
          const existing = (marksMap[student._id] || {})[subject._id];
          return {
            subjectId: subject._id,
            subjectName: subject.name,
            marksId: existing?._id || '',
            theoryMarks: existing?.theoryMarks != null ? existing.theoryMarks : '',
            practicalMarks: existing?.practicalMarks != null ? existing.practicalMarks : ''
          };
        })
      }));

      setMarksMatrix(formattedMatrix);
    } catch (err) {
      console.error(err);
      setMarksMatrix([]);
    }
  };

  const updateMatrixMark = (studentIndex, subjectIndex, field, value) => {
    const updated = [...marksMatrix];
    const row = { ...updated[studentIndex] };
    const subjects = [...row.subjects];
    subjects[subjectIndex] = { ...subjects[subjectIndex], [field]: value };
    row.subjects = subjects;
    updated[studentIndex] = row;
    setMarksMatrix(updated);
  };

  const parseMarkValue = (value) => {
    if (value === '' || value === null || value === undefined) return null;
    const parsed = Number(value);
    return Number.isNaN(parsed) ? NaN : parsed;
  };

  const saveAllMarks = async () => {
    setSaving(true);
    setMessage('');
    let successCount = 0;
    let failureCount = 0;
    let skippedCount = 0;

    const normalizeMarks = (theoryValue, practicalValue) => {
      let theoryParsed = parseMarkValue(theoryValue);
      let practicalParsed = parseMarkValue(practicalValue);
      if (theoryParsed === null && practicalParsed === null) {
        return { skip: true };
      }
      if (theoryParsed === null) theoryParsed = 0;
      if (practicalParsed === null) practicalParsed = 0;
      if (isNaN(theoryParsed) || isNaN(practicalParsed) || theoryParsed < 0 || practicalParsed < 0) {
        return { invalid: true };
      }
      return { theoryParsed, practicalParsed };
    };

    try {
      for (const row of marksMatrix) {
        for (const subjectEntry of row.subjects) {
          const normalized = normalizeMarks(subjectEntry.theoryMarks, subjectEntry.practicalMarks);
          if (normalized.skip) {
            skippedCount++;
            continue;
          }
          if (normalized.invalid) {
            failureCount++;
            continue;
          }

          try {
            await api.post(`/exams/teacher/${examId}/marks`, {
              studentId: row.studentId,
              subjectId: subjectEntry.subjectId,
              theoryMarks: normalized.theoryParsed,
              practicalMarks: normalized.practicalParsed,
              maxTheoryMarks: 50,
              maxPracticalMarks: 50,
              classId: selectedClass,
              teacherId
            });
            successCount++;
          } catch (err) {
            console.error(`Failed to save marks for ${row.studentName} - ${subjectEntry.subjectName}:`, err?.response?.data?.message || err.message);
            failureCount++;
          }
        }
      }

      setMessage(`Saved: ${successCount}, Failed: ${failureCount}, Skipped: ${skippedCount}`);
      setTimeout(() => setMessage(''), 5000);
      if (successCount > 0) loadMarks(students);
    } catch (err) {
      console.error('Unexpected error in saveAllMarks:', err);
      setMessage(`Error: ${err?.response?.data?.message || err.message || 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 text-center text-slate-500">
        Loading your assignments...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
          {error}
        </div>
      </div>
    );
  }

  if (!assignments.classes || assignments.classes.length === 0) {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 p-4 rounded-lg">
          <p className="font-semibold mb-2">No Classes Assigned</p>
          <p className="text-sm">You have not been assigned any classes yet. Please contact the administrator to get class assignments.</p>
        </div>
      </div>
    );
  }

  const selectedClassName = assignments.classes.find(cls => cls._id === selectedClass)?.name || '';
  const subjectColumns = filteredSubjects;

  return (
    <div className="space-y-4">
      {selectedClass && subjectColumns.length === 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
          No subjects are assigned to the selected class for this exam. Please verify your class selection or contact the administrator.
        </div>
      )}
      {!assignments.subjects?.length && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
          No subjects are assigned to you for this exam yet. Please contact the administrator to get subject access before entering marks.
        </div>
      )}

      <div className="mb-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Select Class</label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            >
              <option value="">Select a class</option>
              {assignments.classes.map(cls => (
                <option key={cls._id} value={cls._id}>{cls.name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-end justify-end">
            <button
              type="button"
              onClick={saveAllMarks}
              disabled={saving || !selectedClass || subjectColumns.length === 0 || marksMatrix.length === 0}
              className="w-full md:w-auto px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save All Marks'}
            </button>
          </div>
        </div>
      </div>

      {message && (
        <div className={`p-3 rounded ${message.includes('Error') || message.includes('Failed') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
          {message}
        </div>
      )}

      {!selectedClass ? (
        <div className="text-center text-slate-500 p-6 bg-white rounded-lg">
          Please select a class to enter marks.
        </div>
      ) : marksMatrix.length === 0 ? (
        <div className="text-center text-slate-500 p-6 bg-white rounded-lg">
          No students found for this class.
        </div>
      ) : (
        <div className="overflow-x-auto bg-white shadow rounded-lg">
          <div className="flex flex-wrap gap-2 px-4 py-3 border-b border-slate-200 bg-slate-50 text-sm text-slate-600">
            <span><span className="font-semibold">Class:</span> {selectedClassName || selectedClass}</span>
            <span><span className="font-semibold">Students Found:</span> {students.length}</span>
            <span><span className="font-semibold">Subjects Found:</span> {subjectColumns.length}</span>
          </div>

          <table className="min-w-full border-collapse">
            <thead className="bg-slate-100 border-b-2 border-slate-300">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold border-b border-slate-300">Roll No.</th>
                <th className="px-4 py-3 text-left text-sm font-semibold border-b border-slate-300">Student Name</th>
                {subjectColumns.map(subject => (
                  <th key={subject._id} colSpan="2" className="px-3 py-3 text-center text-sm font-semibold border-l border-slate-300">
                    {subject.name}
                  </th>
                ))}
                <th className="px-4 py-3 text-right text-sm font-semibold border-l border-slate-300">Total</th>
              </tr>
              <tr>
                <th className="px-4 py-3 border-b border-slate-300"></th>
                <th className="px-4 py-3 border-b border-slate-300"></th>
                {subjectColumns.map(subject => (
                  <React.Fragment key={`${subject._id}-header`}>
                    <th className="px-2 py-2 text-xs font-semibold border-l border-slate-300">T</th>
                    <th className="px-2 py-2 text-xs font-semibold">P</th>
                  </React.Fragment>
                ))}
                <th className="px-4 py-3 border-b border-slate-300"></th>
              </tr>
            </thead>
            <tbody>
              {marksMatrix.map((row, rowIndex) => {
                const total = row.subjects.reduce((sum, subject) => sum + (Number(subject.theoryMarks) || 0) + (Number(subject.practicalMarks) || 0), 0);
                return (
                  <tr key={row.studentId} className="border-b border-slate-200 hover:bg-slate-50">
                    <td className="px-4 py-3 text-sm font-medium border-r border-slate-200">{row.rollNumber || '-'}</td>
                    <td className="px-4 py-3 text-sm border-r border-slate-200">{row.studentName}</td>
                    {row.subjects.map((subject, subjectIndex) => (
                      <React.Fragment key={`${row.studentId}-${subject.subjectId}`}>
                        <td className="px-2 py-2 border-l border-slate-200">
                          <input
                            type="text"
                            placeholder="T"
                            value={subject.theoryMarks}
                            onChange={e => updateMatrixMark(rowIndex, subjectIndex, 'theoryMarks', e.target.value)}
                            className="w-14 px-2 py-1.5 border border-slate-300 rounded text-center text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                          />
                        </td>
                        <td className="px-2 py-2">
                          <input
                            type="text"
                            placeholder="P"
                            value={subject.practicalMarks}
                            onChange={e => updateMatrixMark(rowIndex, subjectIndex, 'practicalMarks', e.target.value)}
                            className="w-14 px-2 py-1.5 border border-slate-300 rounded text-center text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                          />
                        </td>
                      </React.Fragment>
                    ))}
                    <td className="px-4 py-3 text-right text-sm font-bold border-l border-slate-300 bg-slate-50">{total}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
