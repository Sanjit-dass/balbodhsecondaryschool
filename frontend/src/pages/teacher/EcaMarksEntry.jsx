import React, { useEffect, useMemo, useState } from 'react';
import api from '../../services/api';

const CLASS_OPTIONS = ['Nursery', 'LKG', 'UKG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];

function normalizeClassName(value) {
  if (!value && value !== 0) return '';
  return String(value).trim().replace(/^class\s+/i, '').trim();
}

export default function EcaMarksEntry() {
  const [academicYear, setAcademicYear] = useState(new Date().getFullYear().toString());
  const [selectedClass, setSelectedClass] = useState('');
  const [students, setStudents] = useState([]);
  const [categories, setCategories] = useState([]);
  const [marks, setMarks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!selectedClass) {
      setStudents([]);
      setCategories([]);
      setMarks([]);
      return;
    }

    const loadData = async () => {
      try {
        setLoading(true);
        const [studentRes, categoryRes] = await Promise.all([
          api.get('/eca/teacher/students', { params: { classId: selectedClass, academicYear } }),
          api.get('/eca/teacher/available', { params: { classId: selectedClass, academicYear } })
        ]);
        setStudents(studentRes.data.students || []);
        setCategories(categoryRes.data.categories || []);
        const existingMarks = await api.get('/eca/teacher/marks', { params: { classId: selectedClass, academicYear } });
        setMarks(existingMarks.data.marks || []);
      } catch (error) {
        console.error(error);
        setMessage('Failed to load ECA marks entry');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [selectedClass, academicYear]);

  const markMap = useMemo(() => {
    const map = new Map();
    marks.forEach((entry) => {
      map.set(`${entry.student?._id || entry.student}-${entry.category?._id || entry.category || entry.categoryName}`, entry);
    });
    return map;
  }, [marks]);

  const handleMarksChange = (studentId, categoryId, value) => {
    setMarks((prev) => {
      const existing = prev.filter((entry) => !(entry.student?._id === studentId && (entry.category?._id || entry.category || entry.categoryName) === categoryId));
      return [...existing, { student: { _id: studentId }, category: { _id: categoryId }, marks: value }];
    });
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const entriesToSave = [];
      marks.forEach((entry) => {
        const gradeValue = String(entry.marks ?? '').trim();
        if (entry.student?._id && (entry.category?._id || entry.category || entry.categoryName) && gradeValue) {
          entriesToSave.push({
            studentId: entry.student._id,
            categoryId: entry.category?._id || entry.category || entry.categoryName,
            marks: gradeValue,
            className: normalizeClassName(selectedClass),
            academicYear,
            status: 'draft'
          });
        }
      });

      if (!entriesToSave.length) {
        setMessage('Enter at least one mark before saving');
        return;
      }

      await Promise.all(entriesToSave.map((entry) => api.post('/eca/teacher/marks', entry)));
      setMessage('ECA marks saved successfully');
      const refreshed = await api.get('/eca/teacher/marks', { params: { classId: selectedClass, academicYear } });
      setMarks(refreshed.data.marks || []);
    } catch (error) {
      console.error(error);
      setMessage(error?.response?.data?.message || 'Unable to save ECA marks');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-semibold">ECA Marks Entry</h1>
        <p className="text-sm text-slate-600">Enter ECA grades such as A, B, or C in the table below.</p>
      </div>

      {message && <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</div>}

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Academic Year</label>
          <input value={academicYear} onChange={(event) => setAcademicYear(event.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Class</label>
          <select value={selectedClass} onChange={(event) => setSelectedClass(event.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2">
            <option value="">Select Class</option>
            {CLASS_OPTIONS.map((className) => <option key={className} value={className}>{className}</option>)}
          </select>
        </div>
      </div>

      {selectedClass && (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-semibold">Mark Entry</h2>
              <p className="text-sm text-slate-500">Only categories assigned to this class are loaded.</p>
            </div>
            <button onClick={handleSave} className="rounded-lg bg-green-600 px-4 py-2 font-medium text-white hover:bg-green-700">Save</button>
          </div>

          {loading ? <div className="text-sm text-slate-500">Loading student data...</div> : (
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-100 text-left text-slate-700">
                    <th className="px-3 py-2">Roll No</th>
                    <th className="px-3 py-2">Student Name</th>
                    {categories.map((category) => <th key={category._id} className="px-3 py-2 text-center">{category.name}</th>)}
                    <th className="px-3 py-2 text-center">Grade</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student) => {
                    const rowEntries = categories.map((category) => {
                      const entry = markMap.get(`${student._id}-${category._id}`) || null;
                      return {
                        category,
                        value: entry?.marks ?? ''
                      };
                    });
                    return (
                      <tr key={student._id} className="border-t border-slate-200">
                        <td className="px-3 py-2">{student.rollNumber || student.admissionNumber || '—'}</td>
                        <td className="px-3 py-2">{student.fullName || student.name || student.user?.name || '—'}</td>
                        {rowEntries.map((item) => (
                          <td key={`${student._id}-${item.category._id}`} className="px-2 py-2 text-center">
                            <input type="text" value={item.value} onChange={(event) => handleMarksChange(student._id, item.category._id, event.target.value)} className="w-20 rounded border border-slate-300 px-2 py-1 text-center" placeholder="A" />
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
