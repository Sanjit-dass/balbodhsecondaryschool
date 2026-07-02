import React, { useEffect, useState } from 'react';
import api from '../services/api';

export default function MarksEntry({ examId, exam, initialSubject = '' }) {
  const [search, setSearch] = useState('');
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [students, setStudents] = useState([]);
  const [marks, setMarks] = useState([]);
  const [marksMatrix, setMarksMatrix] = useState([]);
  
  const [selectedClass, setSelectedClass] = useState(exam?.class?._id || (typeof exam?.class === 'string' ? exam.class : ''));
  const [selectedSubject, setSelectedSubject] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [theoryFullMarks, setTheoryFullMarks] = useState(String(exam?.theoryFullMarks ?? 50));
  const [theoryPassMarks, setTheoryPassMarks] = useState(String(exam?.theoryPassMarks ?? 20));
  const [practicalFullMarks, setPracticalFullMarks] = useState(String(exam?.practicalFullMarks ?? 50));
  const [practicalPassMarks, setPracticalPassMarks] = useState(String(exam?.practicalPassMarks ?? 20));
  const [loadedClass, setLoadedClass] = useState(false);

  const examClassName = exam?.class?.name || (typeof exam?.class === 'string' ? exam.class : '');
  const examClassId = typeof exam?.class === 'string' ? exam.class : exam?.class?._id || '';

  useEffect(() => {
    loadClasses();
  }, []);

  // If exam already has a class assigned, pre-select it and load matrix
  useEffect(() => {
    if (exam?.class) {
      const classId = typeof exam.class === 'string' ? exam.class : (exam.class._id ? String(exam.class._id) : '');
      if (classId) {
        setSelectedClass(classId);
        setSelectedSubject('');
      }
    }
  }, [exam]);

  // Auto-load class data when a class is selected or when the exam already has a class assigned

  useEffect(() => {
    if (selectedClass && selectedSubject) {
      loadMarks();
    } else if (selectedClass && !selectedSubject && students.length && subjects.length) {
      loadAllMarks();
    }
  }, [selectedClass, selectedSubject, students, subjects]);

  // when parent provides an initial subject (e.g., from StudentMarksEntry), set it
  useEffect(() => {
    if (initialSubject) {
      setSelectedSubject(initialSubject);
    }
  }, [initialSubject]);

  const loadClasses = async () => {
    try {
      const res = await api.get('/classes');
      setClasses(res.data.classes || []);
      if (exam?.class) {
        const classId = typeof exam.class === 'string' ? exam.class : (exam.class._id ? String(exam.class._id) : '');
        if (classId) setSelectedClass(classId);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadSubjectsForClass = async (classArg) => {
    try {
      console.debug('=== Frontend: Loading Subjects ===');
      console.debug('Class Argument:', classArg);
      
      // Use the new exam-specific subjects endpoint
      const res = await api.get(`/exams/${examId}/subjects`, { params: { classId: classArg } });
      console.debug('Subjects Response:', res.data);
      setSubjects(res.data.subjects || []);
      console.debug('Subjects loaded:', (res.data.subjects || []).length);
    } catch (err) {
      console.error('loadSubjectsForClass error:', err);
      setSubjects([]);
    }
  };

  const loadStudents = async (classArg) => {
    try {
      setLoading(true);
      console.debug('=== Frontend: Loading Students ===');
      const classParam = classArg || selectedClass;
      console.debug('Class Param:', classParam);
      
      const res = await api.get(`/exams/${examId}/students`, { params: { classId: classParam } });
      console.debug('Students Response:', res.data);
      setStudents(res.data.students || []);
      console.debug('Students loaded:', (res.data.students || []).length);
      console.debug('Resolved Class Name:', res.data.className);
    } catch (err) {
      console.error('loadStudents error:', err);
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  const loadClassData = async () => {
    if (!selectedClass) return;
    setLoadedClass(false);
    await loadSubjectsForClass(selectedClass);
    await loadStudents(selectedClass);
    setLoadedClass(true);
  };

  // Auto-load class data when a class is selected (e.g., exam pre-selects class)
  useEffect(() => {
    if (selectedClass) {
      loadClassData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClass]);

  const loadMarks = async () => {
    try {
      const res = await api.get(`/exams/${examId}/marks?classId=${selectedClass}&subjectId=${selectedSubject}`);
      const marksList = res.data.marks || [];
      
      // Create marks array for all students with existing marks
      const marksMap = new Map(marksList.map(m => [m.student?._id || m.student, m]));
      const formattedMarks = students.map(s => {
        const existing = marksMap.get(s._id) || marksMap.get(s.user?._id);
        const defaultTheoryMax = Number(theoryFullMarks) || 50;
        const defaultPracticalMax = Number(practicalFullMarks) || 50;
        return {
          _id: existing?._id || '',
          studentId: s._id,
          studentName: s.user?.name || s.fullName || 'N/A',
          rollNumber: s.admissionNumber || s.rollNumber || '',
          theoryMarks: existing?.theoryMarks != null ? existing.theoryMarks : '',
          practicalMarks: existing?.practicalMarks != null ? existing.practicalMarks : '',
          maxTheoryMarks: existing?.maxTheoryMarks != null ? existing.maxTheoryMarks : defaultTheoryMax,
          maxPracticalMarks: existing?.maxPracticalMarks != null ? existing.maxPracticalMarks : defaultPracticalMax
        };
      });
      setMarks(formattedMarks);
    } catch (err) {
      console.error(err);
    }
  };

  const loadAllMarks = async () => {
    try {
      console.debug('=== Frontend: Loading All Marks ===');
      console.debug('Selected Class:', selectedClass);
      console.debug('Students Count:', students.length);
      console.debug('Subjects Count:', subjects.length);
      
      const res = await api.get(`/exams/${examId}/marks?classId=${selectedClass}`);
      const marksList = res.data.marks || [];
      console.debug('Marks loaded:', marksList.length);
      
      // build map studentId -> subjectId -> mark
      const marksMap = {};
      for (const m of marksList) {
        const sid = m.student?._id || m.student;
        const subid = m.subject?._id || m.subject;
        marksMap[sid] = marksMap[sid] || {};
        marksMap[sid][subid] = m;
      }

      const matrix = students.map(s => {
        const studentMarks = subjects.map(sub => {
          const existing = (marksMap[s._id] || {})[sub._id];
          const defaultTheoryMax = Number(theoryFullMarks) || 50;
          const defaultPracticalMax = Number(practicalFullMarks) || 50;
            return {
            subjectId: sub._id,
            subjectName: sub.name,
            marksId: existing?._id || '',
            theoryMarks: existing?.theoryMarks != null ? existing.theoryMarks : '',
            practicalMarks: existing?.practicalMarks != null ? existing.practicalMarks : '',
            maxTheoryMarks: existing?.maxTheoryMarks != null ? existing.maxTheoryMarks : defaultTheoryMax,
            maxPracticalMarks: existing?.maxPracticalMarks != null ? existing.maxPracticalMarks : defaultPracticalMax,
            obtained: existing?.marksObtained || '',
              maxMarks: existing?.maxMarks != null ? existing.maxMarks : (sub.maxMarks != null ? Number(sub.maxMarks) : (defaultTheoryMax + defaultPracticalMax)),
              passMarks: existing?.passMarks != null ? existing.passMarks : (sub.passMarks != null ? Number(sub.passMarks) : (Number(theoryPassMarks) || 20))
          };
        });
        return {
          studentId: s._id,
          studentName: s.user?.name || s.fullName || 'N/A',
          rollNumber: s.admissionNumber || s.rollNumber || '',
          subjects: studentMarks
        };
      });
      setMarksMatrix(matrix);
      console.debug('Matrix built with', matrix.length, 'students');
    } catch (err) {
      console.error(err);
    }
  };

  const updateMark = (index, field, value) => {
    const updated = [...marks];
    // keep theoryMarks and practicalMarks as text in the UI, parse/validate when saving
    updated[index] = { ...updated[index], [field]: field === 'maxTheoryMarks' || field === 'maxPracticalMarks' ? Number(value) || '' : value };
    setMarks(updated);
  };

  const saveMark = async (mark) => {
    const theoryParsed = Number(mark.theoryMarks);
    const practicalParsed = Number(mark.practicalMarks);
    
    if (mark.theoryMarks === '' || mark.theoryMarks === null || isNaN(theoryParsed)) {
      alert('Please enter numeric theory marks');
      return;
    }
    if (mark.practicalMarks === '' || mark.practicalMarks === null || isNaN(practicalParsed)) {
      alert('Please enter numeric practical marks');
      return;
    }
    if (theoryParsed < 0 || practicalParsed < 0) {
      alert('Marks cannot be negative');
      return;
    }
    
    const maxTheory = Number(mark.maxTheoryMarks) || Number(theoryFullMarks) || 50;
    const maxPractical = Number(mark.maxPracticalMarks) || Number(practicalFullMarks) || 50;
    
    if (theoryParsed > maxTheory) {
      alert(`Theory marks cannot be greater than ${maxTheory}`);
      return;
    }
    if (practicalParsed > maxPractical) {
      alert(`Practical marks cannot be greater than ${maxPractical}`);
      return;
    }
    
    try {
      setSaving(true);
      await api.post(`/exams/${examId}/marks`, {
        studentId: mark.studentId,
        subjectId: selectedSubject,
        theoryMarks: theoryParsed,
        practicalMarks: practicalParsed,
        maxTheoryMarks: maxTheory,
        maxPracticalMarks: maxPractical,
        classId: selectedClass
      });
      setMessage('Marks saved successfully');
      setTimeout(() => setMessage(''), 3000);
      loadMarks();
    } catch (err) {
      console.error(err);
      alert('Error saving marks: ' + (err?.response?.data?.message || err.message));
    } finally {
      setSaving(false);
    }
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

    const normalizeMarks = (theoryValue, practicalValue, maxTheory, maxPractical) => {
      let theoryParsed = parseMarkValue(theoryValue);
      let practicalParsed = parseMarkValue(practicalValue);
      if (theoryParsed === null && practicalParsed === null) {
        return { skip: true };
      }
      if (theoryParsed === null) theoryParsed = 0;
      if (practicalParsed === null) practicalParsed = 0;
      if (isNaN(theoryParsed) || isNaN(practicalParsed)) {
        return { invalid: true };
      }
      if (theoryParsed < 0 || practicalParsed < 0 || theoryParsed > maxTheory || practicalParsed > maxPractical) {
        return { invalid: true };
      }
      return { theoryParsed, practicalParsed };
    };

    try {
      if (selectedSubject) {
        // single-subject flow
        for (const mark of marks) {
          const maxTheory = Number(mark.maxTheoryMarks) || Number(theoryFullMarks) || 50;
          const maxPractical = Number(mark.maxPracticalMarks) || Number(practicalFullMarks) || 50;
          const normalized = normalizeMarks(mark.theoryMarks, mark.practicalMarks, maxTheory, maxPractical);
          if (normalized.skip) {
            skippedCount++;
            continue;
          }
          if (normalized.invalid) {
            failureCount++;
            continue;
          }
          try {
            await api.post(`/exams/${examId}/marks`, {
              studentId: mark.studentId,
              subjectId: selectedSubject,
              theoryMarks: normalized.theoryParsed,
              practicalMarks: normalized.practicalParsed,
              maxTheoryMarks: maxTheory,
              maxPracticalMarks: maxPractical,
              classId: selectedClass
            });
            successCount++;
          } catch (err) {
            console.error(`Failed to save marks for ${mark.studentName}:`, err?.response?.data?.message || err.message);
            failureCount++;
          }
        }
        setMessage(`Saved: ${successCount}, Failed: ${failureCount}, Skipped: ${skippedCount}`);
        setTimeout(() => setMessage(''), 5000);
        if (successCount > 0) loadMarks();
      } else {
        // multi-subject matrix save - update to use theory/practical
        for (const row of marksMatrix) {
          for (const subEntry of row.subjects) {
            const maxTheory = Number(subEntry.maxTheoryMarks) || Number(theoryFullMarks) || 50;
            const maxPractical = Number(subEntry.maxPracticalMarks) || Number(practicalFullMarks) || 50;
            const normalized = normalizeMarks(subEntry.theoryMarks, subEntry.practicalMarks, maxTheory, maxPractical);
            if (normalized.skip) {
              skippedCount++;
              continue;
            }
            if (normalized.invalid) {
              failureCount++;
              continue;
            }
            try {
              await api.post(`/exams/${examId}/marks`, {
                studentId: row.studentId,
                subjectId: subEntry.subjectId,
                theoryMarks: normalized.theoryParsed,
                practicalMarks: normalized.practicalParsed,
                maxTheoryMarks: maxTheory,
                maxPracticalMarks: maxPractical,
                classId: selectedClass
              });
              successCount++;
            } catch (err) {
              console.error(`Failed to save marks for ${row.studentName} - ${subEntry.subjectName}:`, err?.response?.data?.message || err.message);
              failureCount++;
            }
          }
        }
        setMessage(`Saved: ${successCount}, Failed: ${failureCount}, Skipped: ${skippedCount}`);
        setTimeout(() => setMessage(''), 5000);
        if (successCount > 0) loadAllMarks();
      }
    } catch (err) {
      console.error('Unexpected error in saveAllMarks:', err);
      setMessage(`Error: ${err?.response?.data?.message || err.message || 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  const updateMatrixMark = (studentIdx, subjectIdx, field, value) => {
    const updated = [...marksMatrix];
    const row = { ...updated[studentIdx] };
    const subs = [...row.subjects];
    // Convert max fields to numbers
    if (field === 'maxTheoryMarks' || field === 'maxPracticalMarks') {
      subs[subjectIdx] = { ...subs[subjectIdx], [field]: Number(value) || '' };
    } else {
      subs[subjectIdx] = { ...subs[subjectIdx], [field]: value };
    }
    row.subjects = subs;
    updated[studentIdx] = row;
    setMarksMatrix(updated);
  };

  return (
    <div className="w-full max-w-full space-y-4">
      <div className="mb-3">
        <div className="flex items-center justify-between gap-4">
          {/* If exam already has a class, show it as text. Otherwise show dropdown */}
          <div className="flex-1">
            {examClassName ? (
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Class</label>
                <div className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm font-medium">
                  {examClassName}
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Class</label>
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                >
                  <option value="">Select a class</option>
                  {classes.map(cls => (
                    <option key={cls._id} value={cls._id}>{cls.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
          <div className="flex-1">
            <div className="space-y-2">
              <button
                type="button"
                onClick={saveAllMarks}
                disabled={saving || !selectedClass || !loadedClass || (selectedSubject ? marks.length === 0 : marksMatrix.length === 0)}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 mt-6"
              >
                Save All Marks
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Theory and Practical Marks Configuration */}
      <div className="bg-white shadow rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Theory Full Marks</label>
            <input
              type="text"
              value={theoryFullMarks}
              onChange={(e) => setTheoryFullMarks(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Theory Pass Marks</label>
            <input
              type="text"
              value={theoryPassMarks}
              onChange={(e) => setTheoryPassMarks(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Practical Full Marks</label>
            <input
              type="text"
              value={practicalFullMarks}
              onChange={(e) => setPracticalFullMarks(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Practical Pass Marks</label>
            <input
              type="text"
              value={practicalPassMarks}
              onChange={(e) => setPracticalPassMarks(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Total Marks / Subject</label>
            <div className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-slate-50 text-sm font-semibold text-slate-700">
              {(Number(theoryFullMarks) || 0) + (Number(practicalFullMarks) || 0)}
            </div>
          </div>
        </div>
        <p className="mt-2 text-xs text-slate-500">Theory pass mark: {Number(theoryPassMarks) || 20} / {Number(theoryFullMarks) || 50}. Practical pass mark: {Number(practicalPassMarks) || 20} / {Number(practicalFullMarks) || 50}. Total per subject: {(Number(theoryFullMarks) || 0) + (Number(practicalFullMarks) || 0)}.</p>
      </div>

      {message && <div className="p-3 bg-green-100 text-green-700 rounded">{message}</div>}

      {/* Status Display */}
      {selectedClass && loadedClass && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <span className="font-semibold text-blue-900">Class:</span>
              <span className="text-blue-700"> {examClassName || 'Resolved from ObjectId'}</span>
            </div>
            <div>
              <span className="font-semibold text-blue-900">Students Found:</span>
              <span className="text-blue-700"> {students.length}</span>
            </div>
            <div>
              <span className="font-semibold text-blue-900">Subjects Found:</span>
              <span className="text-blue-700"> {subjects.length}</span>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center text-slate-500">Loading students...</div>
      ) : !selectedClass ? (
        <div className="text-center text-slate-500 p-6 bg-white rounded-lg">Please select a class to enter marks</div>
      ) : !loadedClass ? (
        <div className="text-center text-slate-500 p-6 bg-white rounded-lg">Loading class students and subjects...</div>
      ) : (students.length === 0 && subjects.length === 0) ? (
        <div className="text-center text-slate-500 p-6 bg-white rounded-lg">No records found for this class</div>
      ) : students.length === 0 ? (
        <div className="text-center text-slate-500 p-6 bg-white rounded-lg">No students found for this class</div>
      ) : subjects.length === 0 ? (
        <div className="text-center text-slate-500 p-6 bg-white rounded-lg">No subjects have been created for this class yet. Please contact admin.</div>
      ) : (selectedSubject ? (
        // single-subject mode
        (marks.length === 0 ? (
          <div className="text-center text-slate-500">No students or marks for this subject.</div>
        ) : (
          <div className="overflow-x-auto bg-white shadow rounded-lg">
            <table className="w-full border-collapse">
              <thead className="bg-slate-100 border-b-2 border-slate-300">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold border-b border-slate-300">Roll No.</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold border-b border-slate-300">Student Name</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold border-l border-slate-300">Theory Marks</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold">Max Theory</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold">Practical Marks</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold">Max Practical</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold border-l border-slate-300">Total</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold">Status</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {marks
                  .filter(m => {
                    if (!search) return true;
                    const q = search.toLowerCase();
                    return (m.studentName || '').toLowerCase().includes(q) || String(m.rollNumber || '').toLowerCase().includes(q);
                  })
                  .map((mark, idx) => {
                    const total = (Number(mark.theoryMarks) || 0) + (Number(mark.practicalMarks) || 0);
                    const maxTotal = (mark.maxTheoryMarks || 50) + (mark.maxPracticalMarks || 50);
                    const passThreshold = maxTotal * 0.4; // 40% pass
                    const theoryPassThreshold = Number(theoryPassMarks) || 20;
                    const practicalPassThreshold = Number(practicalPassMarks) || 20;
                    const theory = mark.theoryMarks !== '' && mark.theoryMarks !== null ? Number(mark.theoryMarks) : 0;
                    const practical = mark.practicalMarks !== '' && mark.practicalMarks !== null ? Number(mark.practicalMarks) : 0;
                    const status = (mark.theoryMarks !== '' && mark.practicalMarks !== '' && !isNaN(theory) && !isNaN(practical)) 
                      ? (theory > theoryPassThreshold && practical > practicalPassThreshold ? 'Pass' : 'Fail') 
                      : 'N/A';
                    return (
                    <tr key={idx} className="border-b border-slate-200 hover:bg-slate-50">
                      <td className="px-4 py-3 text-sm font-medium border-r border-slate-200">{mark.rollNumber || '-'}</td>
                      <td className="px-4 py-3 text-sm border-r border-slate-200">{mark.studentName}</td>
                      <td className="px-4 py-2 border-l border-slate-200">
                        <input
                          type="text"
                          placeholder="T"
                          value={mark.theoryMarks}
                          onChange={e => updateMark(idx, 'theoryMarks', e.target.value)}
                          className="w-16 px-2 py-1.5 border border-slate-300 rounded text-center text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="number"
                          placeholder="50"
                          value={mark.maxTheoryMarks}
                          onChange={e => updateMark(idx, 'maxTheoryMarks', e.target.value)}
                          min="0"
                          className="w-16 px-2 py-1.5 border border-slate-300 rounded text-center text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="text"
                          placeholder="P"
                          value={mark.practicalMarks}
                          onChange={e => updateMark(idx, 'practicalMarks', e.target.value)}
                          className="w-16 px-2 py-1.5 border border-slate-300 rounded text-center text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="number"
                          placeholder="50"
                          value={mark.maxPracticalMarks}
                          onChange={e => updateMark(idx, 'maxPracticalMarks', e.target.value)}
                          min="0"
                          className="w-16 px-2 py-1.5 border border-slate-300 rounded text-center text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                        />
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-bold border-l border-slate-300 bg-slate-50">{total}</td>
                      <td className="px-4 py-3 text-center text-sm font-semibold bg-slate-50">
                        {status}
                      </td>
                      <td className="px-4 py-2 text-center">
                        <button
                          type="button"
                          onClick={() => saveMark(mark)}
                          disabled={saving}
                          className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50"
                        >
                          Save
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ))
      ) : (
        // matrix mode (render table even if marksMatrix empty)
        <div className="w-full max-w-full overflow-x-auto overflow-y-visible rounded-lg border border-slate-200 bg-white shadow-sm">
          <div
            className="min-w-0"
            style={{ minWidth: `${Math.max(900, 220 + subjects.length * 92)}px` }}
          >
            <table className="w-full border-collapse">
              {/* HEADER */}
              <thead className="bg-slate-100 border-b-2 border-slate-300">
                <tr>
                  <th className="sticky left-0 z-10 px-3 py-3 text-left text-sm font-semibold border-b border-slate-300 bg-slate-100 w-[70px]">
                    Roll No.
                  </th>

                  <th className="sticky left-[70px] z-10 px-3 py-3 text-left text-sm font-semibold border-b border-slate-300 bg-slate-100 w-[160px]">
                    Student Name
                  </th>

                  {subjects.map(sub => (
                    <th
                      key={sub._id}
                      colSpan={2}
                      className="px-2 py-3 text-center text-sm font-semibold bg-slate-200 border-l-2 border-slate-300 min-w-[90px] whitespace-normal leading-tight"
                    >
                      {sub.name}
                    </th>
                  ))}

                  <th className="px-3 py-3 text-right text-sm font-semibold border-l-2 border-slate-300 w-[90px]">
                    Total
                  </th>
                </tr>

                {/* T / P ROW */}
                <tr className="bg-slate-50 border-b border-slate-300">
                  <th className="sticky left-0 z-10 bg-slate-50"></th>
                  <th className="sticky left-[70px] z-10 bg-slate-50"></th>

                  {subjects.map(sub => (
                    <React.Fragment key={sub._id}>
                      <th className="px-1 py-2 text-center text-xs font-semibold border-l border-slate-300 w-[48px]">
                        T
                      </th>
                      <th className="px-1 py-2 text-center text-xs font-semibold w-[48px]">
                        P
                      </th>
                    </React.Fragment>
                  ))}

                  <th></th>
                </tr>
              </thead>

              {/* BODY */}
              <tbody>
                {marksMatrix.length === 0 ? (
                  <tr>
                    <td
                      colSpan={2 + subjects.length * 2}
                      className="p-6 text-center text-slate-500"
                    >
                      Loading marks...
                    </td>
                  </tr>
                ) : (
                  marksMatrix
                    .filter(r => {
                      if (!search) return true;
                      const q = search.toLowerCase();
                      return (
                        (r.studentName || '').toLowerCase().includes(q) ||
                        String(r.rollNumber || '').toLowerCase().includes(q)
                      );
                    })
                    .map((row, ridx) => (
                      <tr key={ridx} className="border-b border-slate-200 hover:bg-slate-50">
                        {/* Roll No */}
                        <td className="sticky left-0 z-10 px-3 py-3 text-sm font-medium border-r border-slate-200 bg-white w-[70px]">
                          {row.rollNumber || '-'}
                        </td>

                        {/* Name */}
                        <td className="sticky left-[70px] z-10 px-3 py-3 text-sm border-r border-slate-200 bg-white w-[160px]">
                          {row.studentName}
                        </td>

                        {/* Subjects */}
                        {row.subjects.map((sub, sidx) => (
                          <React.Fragment key={sub.subjectId}>
                            <td className="px-1 py-2 w-[48px] border-l border-slate-200">
                              <input
                                type="text"
                                placeholder="T"
                                value={sub.theoryMarks}
                                onChange={e =>
                                  updateMatrixMark(ridx, sidx, 'theoryMarks', e.target.value)
                                }
                                className="w-10 px-1 py-1 border border-slate-300 rounded text-center text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                              />
                            </td>

                            <td className="px-1 py-2 w-[48px]">
                              <input
                                type="text"
                                placeholder="P"
                                value={sub.practicalMarks}
                                onChange={e =>
                                  updateMatrixMark(ridx, sidx, 'practicalMarks', e.target.value)
                                }
                                className="w-10 px-1 py-1 border border-slate-300 rounded text-center text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                              />
                            </td>
                          </React.Fragment>
                        ))}

                        {/* Total */}
                        <td className="px-3 py-3 text-right text-sm font-bold w-[90px] border-l-2 border-slate-300 bg-slate-50">
                          {row.subjects.reduce((sum, sub) => {
                            const theory =
                              sub.theoryMarks !== '' && sub.theoryMarks !== null
                                ? Number(sub.theoryMarks)
                                : 0;

                            const practical =
                              sub.practicalMarks !== '' && sub.practicalMarks !== null
                                ? Number(sub.practicalMarks)
                                : 0;

                            return sum + (isNaN(theory) ? 0 : theory) + (isNaN(practical) ? 0 : practical);
                          }, 0)}
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}
