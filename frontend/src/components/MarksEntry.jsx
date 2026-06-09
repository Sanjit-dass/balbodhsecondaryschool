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
  const [fullMarks, setFullMarks] = useState(exam?.maxMarks || 100);
  const [passMarks, setPassMarks] = useState(exam?.passMarks || 40);
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
        return {
          _id: existing?._id || '',
          studentId: s._id,
          studentName: s.user?.name || s.fullName || 'N/A',
          rollNumber: s.admissionNumber || s.rollNumber || '',
          marksObtained: existing?.marksObtained || '',
          maxMarks: existing?.maxMarks || exam?.maxMarks || 100
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
          return {
            subjectId: sub._id,
            subjectName: sub.name,
            marksId: existing?._id || '',
            obtained: existing?.marksObtained || '',
            maxMarks: existing?.maxMarks || sub.maxMarks || exam?.maxMarks || 100,
            passMarks: existing?.passMarks || exam?.passMarks || sub.passMarks || 0
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
    // keep marksObtained as text in the UI, parse/validate when saving
    updated[index] = { ...updated[index], [field]: field === 'maxMarks' ? Number(value) || '' : value };
    setMarks(updated);
  };

  const saveMark = async (mark) => {
    const parsed = Number(mark.marksObtained);
    if (mark.marksObtained === '' || isNaN(parsed)) {
      alert('Please enter numeric marks');
      return;
    }
    if (parsed < 0) {
      alert('Marks cannot be negative');
      return;
    }
    if (parsed > (mark.maxMarks || exam?.maxMarks || 100)) {
      alert('Marks cannot be greater than Max Marks');
      return;
    }
    try {
      setSaving(true);
      await api.post(`/exams/${examId}/marks`, {
        studentId: mark.studentId,
        subjectId: selectedSubject,
        marksObtained: parsed,
        maxMarks: mark.maxMarks,
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

  const saveAllMarks = async () => {
    setSaving(true);
    setMessage('');
    let successCount = 0;
    let failureCount = 0;
    let skippedCount = 0;
    
    try {
      if (selectedSubject) {
        // single-subject flow
        for (const mark of marks) {
          if (mark.marksObtained === '' && mark.marksObtained !== 0) {
            skippedCount++;
            continue;
          }
          const parsed = Number(mark.marksObtained);
          if (isNaN(parsed)) {
            skippedCount++;
            continue;
          }
          if (parsed < 0 || parsed > (mark.maxMarks || exam?.maxMarks || 100)) {
            skippedCount++;
            continue;
          }
          try {
            await api.post(`/exams/${examId}/marks`, {
              studentId: mark.studentId,
              subjectId: selectedSubject,
              marksObtained: parsed,
              maxMarks: mark.maxMarks,
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
        // multi-subject matrix save
        for (const row of marksMatrix) {
          for (const subEntry of row.subjects) {
            const ob = subEntry.obtained === '' ? null : Number(subEntry.obtained);
            if (ob === null) {
              skippedCount++;
              continue;
            }
            if (isNaN(ob) || ob < 0 || ob > (subEntry.maxMarks || exam?.maxMarks || 100)) {
              skippedCount++;
              continue;
            }
            try {
              await api.post(`/exams/${examId}/marks`, {
                studentId: row.studentId,
                subjectId: subEntry.subjectId,
                marksObtained: ob,
                maxMarks: subEntry.maxMarks,
                passMarks: subEntry.passMarks,
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
    subs[subjectIdx] = { ...subs[subjectIdx], [field]: value };
    row.subjects = subs;
    updated[studentIdx] = row;
    setMarksMatrix(updated);
  };

  return (
    <div className="space-y-4">
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

      {/* Full Marks and Pass Marks Input Fields */}
      <div className="bg-white shadow rounded-lg p-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Full Marks</label>
            <input
              type="number"
              value={fullMarks}
              onChange={(e) => setFullMarks(Number(e.target.value) || 100)}
              min="0"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Pass Marks</label>
            <input
              type="number"
              value={passMarks}
              onChange={(e) => setPassMarks(Number(e.target.value) || 40)}
              min="0"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            />
          </div>
        </div>
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
            <table className="w-full">
              <thead className="bg-slate-100 border-b">
                <tr>
                  <th className="px-4 py-2 text-left text-sm font-semibold">Roll No.</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold">Student Name</th>
                  <th className="px-4 py-2 text-right text-sm font-semibold">Marks Obtained</th>
                  <th className="px-4 py-2 text-right text-sm font-semibold">Max Marks</th>
                  <th className="px-4 py-2 text-center text-sm font-semibold">Status</th>
                  <th className="px-4 py-2 text-center text-sm font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {marks
                  .filter(m => {
                    if (!search) return true;
                    const q = search.toLowerCase();
                    return (m.studentName || '').toLowerCase().includes(q) || String(m.rollNumber || '').toLowerCase().includes(q);
                  })
                  .map((mark, idx) => (
                  <tr key={idx} className="border-b hover:bg-slate-50">
                    <td className="px-4 py-2 text-sm">{mark.rollNumber || '-'}</td>
                    <td className="px-4 py-2 text-sm">{mark.studentName}</td>
                    <td className="px-4 py-2">
                      <input
                        type="text"
                        value={mark.marksObtained}
                        onChange={e => updateMark(idx, 'marksObtained', e.target.value)}
                        className="w-full px-2 py-1 border border-slate-300 rounded text-right"
                        placeholder="0"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="number"
                        value={mark.maxMarks}
                        onChange={e => updateMark(idx, 'maxMarks', e.target.value)}
                        min="0"
                        className="w-full px-2 py-1 border border-slate-300 rounded text-right"
                      />
                    </td>
                    <td className="px-4 py-2 text-center">
                      {(() => {
                        const val = Number(mark.marksObtained);
                        const max = mark.maxMarks || exam?.maxMarks || 100;
                        if (mark.marksObtained === '' || isNaN(val)) return 'N/A';
                        return val >= (exam?.passMarks ?? 40) ? 'Pass' : 'Fail';
                      })()}
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
                ))}
              </tbody>
            </table>
          </div>
        ))
      ) : (
        // matrix mode (render table even if marksMatrix empty)
        <div className="overflow-x-auto bg-white shadow rounded-lg">
          <table className="w-full">
            <thead className="bg-slate-100 border-b">
              <tr>
                <th className="px-4 py-2 text-left text-sm font-semibold">Roll No.</th>
                <th className="px-4 py-2 text-left text-sm font-semibold">Student Name</th>
                {subjects.map(sub => (
                  <th key={sub._id} className="px-4 py-2 text-center text-sm font-semibold">{sub.name}</th>
                ))}
                <th className="px-4 py-2 text-right text-sm font-semibold">Total</th>
                <th className="px-4 py-2 text-right text-sm font-semibold">Percentage</th>
              </tr>
            </thead>
            <tbody>
              {marksMatrix.length === 0 ? (
                <tr><td colSpan={2 + subjects.length} className="p-6 text-center text-slate-500">Loading marks...</td></tr>
              ) : (
                marksMatrix
                  .filter(r => {
                    if (!search) return true;
                    const q = search.toLowerCase();
                    return (r.studentName || '').toLowerCase().includes(q) || String(r.rollNumber || '').toLowerCase().includes(q);
                  })
                  .map((row, ridx) => (
                  <tr key={ridx} className="border-b hover:bg-slate-50">
                    <td className="px-4 py-2 text-sm font-medium">{row.rollNumber || '-'}</td>
                    <td className="px-4 py-2 text-sm">{row.studentName}</td>
                    {row.subjects.map((sub, sidx) => (
                      <td key={sub.subjectId} className="px-2 py-2 text-sm">
                        <input type="text" placeholder="Marks" value={sub.obtained}
                          onChange={e => updateMatrixMark(ridx, sidx, 'obtained', e.target.value)}
                          className="w-full px-2 py-1 border border-slate-300 rounded text-center text-sm" />
                      </td>
                    ))}
                    <td className="px-4 py-2 text-right text-sm font-semibold">
                      {row.subjects.reduce((sum, sub) => {
                        const val = Number(sub.obtained);
                        return sum + (isFinite(val) ? val : 0);
                      }, 0)}
                    </td>
                    <td className="px-4 py-2 text-right text-sm font-semibold">
                      {(() => {
                        const total = row.subjects.reduce((sum, sub) => sum + (sub.maxMarks ? Number(sub.maxMarks) : 0), 0);
                        const obtained = row.subjects.reduce((sum, sub) => {
                          const val = Number(sub.obtained);
                          return sum + (isFinite(val) ? val : 0);
                        }, 0);
                        return total ? `${((obtained / total) * 100).toFixed(2)}%` : '0.00%';
                      })()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}
