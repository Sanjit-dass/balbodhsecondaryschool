import { useState, useEffect } from 'react';
import api from '../../services/api';

const CLASS_OPTIONS = ['Nursery', 'LKG', 'UKG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];

function getAcademicYears() {
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let i = 0; i < 5; i++) {
    years.push((currentYear - i).toString());
  }
  return years;
}

export default function TeacherSubjectAssignments() {
  const [assignments, setAssignments] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [teachersLoading, setTeachersLoading] = useState(false);
  const [subjectsLoading, setSubjectsLoading] = useState(false);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [formData, setFormData] = useState({
    teacher: '',
    class: '',
    subjects: [],
    academicYear: new Date().getFullYear().toString()
  });

  useEffect(() => {
    fetchAssignments();
    fetchTeachers();
    fetchClasses();
  }, []);

  useEffect(() => {
    if (formData.class) {
      fetchSubjects(formData.class);
    }
  }, [formData.class]);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const res = await api.get('/teacher-subject-assignments');
      setAssignments(res.data || []);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch assignments');
    } finally {
      setLoading(false);
    }
  };

  const fetchTeachers = async () => {
    try {
      setTeachersLoading(true);
      const res = await api.get('/teachers');
      console.log('Teachers API response:', res.data);
      // Ensure teachers is always an array
      const teachersData = Array.isArray(res.data) ? res.data : (res.data?.teachers || []);
      console.log('Teachers loaded:', teachersData);
      setTeachers(teachersData);
    } catch (err) {
      console.error('Error loading teachers:', err);
      setError('Failed to load teachers');
      setTeachers([]); // Set empty array on error
    } finally {
      setTeachersLoading(false);
    }
  };

  const fetchClasses = async () => {
    try {
      const res = await api.get('/classes');
      setClasses(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSubjects = async (classId) => {
    try {
      setSubjectsLoading(true);
      // Pass class parameter to get class-specific subjects
      const res = await api.get(`/subjects?classId=${classId}`);
      console.log('Subjects API response:', res.data);
      
      // The API returns {subjects: [...]}
      let allSubjects = res.data?.subjects || res.data || [];
      
      // Ensure it's an array
      if (!Array.isArray(allSubjects)) {
        console.log('Subjects data is not an array, converting:', allSubjects);
        allSubjects = [];
      }
      
      console.log('All subjects array:', allSubjects);
      console.log('Class ID:', classId);
      
      // If no class-specific subjects found, try without class filter to show all
      if (allSubjects.length === 0) {
        console.log('No class-specific subjects found, fetching all subjects');
        const allRes = await api.get('/subjects');
        let allSubjectsData = allRes.data?.subjects || allRes.data || [];
        
        // Ensure it's an array
        if (!Array.isArray(allSubjectsData)) {
          allSubjectsData = [];
        }
        
        setSubjects(allSubjectsData);
      } else {
        setSubjects(allSubjects);
      }
      
    } catch (err) {
      console.error('Error loading subjects:', err);
      // On error, try to fetch all subjects as fallback
      try {
        const fallbackRes = await api.get('/subjects');
        let fallbackSubjects = fallbackRes.data?.subjects || fallbackRes.data || [];
        
        // Ensure it's an array
        if (!Array.isArray(fallbackSubjects)) {
          fallbackSubjects = [];
        }
        
        setSubjects(fallbackSubjects);
      } catch (fallbackErr) {
        setSubjects([]);
      }
    } finally {
      setSubjectsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!formData.teacher) {
      setError('Teacher is required');
      return;
    }
    if (!formData.class) {
      setError('Class is required');
      return;
    }
    if (formData.subjects.length === 0) {
      setError('At least one subject must be selected');
      return;
    }

    try {
      const payload = {
        teacher: formData.teacher,
        teacherId: formData.teacherId,
        class: formData.class,
        subjects: formData.subjects,
        academicYear: formData.academicYear
      };

      if (editing) {
        await api.put(`/teacher-subject-assignments/${editing._id}`, payload);
        setMessage('Assignment updated successfully');
      } else {
        await api.post('/teacher-subject-assignments', payload);
        setMessage('Assignment created successfully');
      }
      setTimeout(() => setMessage(''), 3000);
      setShowForm(false);
      setEditing(null);
      resetForm();
      fetchAssignments();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Error saving assignment');
    }
  };

  const handleEdit = (assignment) => {
    setEditing(assignment);
    setFormData({
      teacher: assignment.teacher._id,
      class: assignment.class._id,
      subjects: assignment.subjects.map(s => s._id),
      academicYear: assignment.academicYear
    });
    setShowForm(true);
    fetchSubjects(assignment.class._id);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this assignment?')) return;
    try {
      await api.delete(`/teacher-subject-assignments/${id}`);
      setMessage('Assignment deleted successfully');
      setTimeout(() => setMessage(''), 3000);
      fetchAssignments();
    } catch (err) {
      console.error(err);
      setError('Error deleting assignment');
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditing(null);
    resetForm();
    setError('');
  };

  const resetForm = () => {
    setFormData({
      teacher: '',
      class: '',
      subjects: [],
      academicYear: new Date().getFullYear().toString()
    });
    setSubjects([]);
  };

  const handleSubjectToggle = (subjectId) => {
    setFormData(prev => ({
      ...prev,
      subjects: prev.subjects.includes(subjectId)
        ? prev.subjects.filter(id => id !== subjectId)
        : [...prev.subjects, subjectId]
    }));
  };

  const getSelectedTeacher = () => teachers.find(t => t._id === formData.teacher);
  const getSelectedClass = () => classes.find(c => c._id === formData.class) || CLASS_OPTIONS.find(c => c === formData.class);

  // Filter assignments based on search
  const filteredAssignments = assignments.filter(assignment => {
    const search = searchTerm.toLowerCase();
    return (
      assignment.teacherName?.toLowerCase().includes(search) ||
      assignment.teacherId?.toLowerCase().includes(search) ||
      assignment.className?.toLowerCase().includes(search) ||
      assignment.subjectNames?.some(name => name.toLowerCase().includes(search))
    );
  });

  // Pagination
  const totalPages = Math.ceil(filteredAssignments.length / itemsPerPage);
  const paginatedAssignments = filteredAssignments.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Teacher Subject Assignments</h1>
          <p className="text-sm text-slate-600">Assign teachers to subjects for different classes</p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Assignment
          </button>
        )}
      </div>

      {message && (
        <div className="p-4 rounded-lg bg-green-50 border border-green-200 text-green-700">
          {message}
        </div>
      )}

      {error && (
        <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700">
          {error}
        </div>
      )}

      {showForm && (
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-6">
          <h2 className="text-xl font-semibold mb-6 text-slate-900">
            {editing ? 'Edit Assignment' : 'New Assignment'}
          </h2>
          {teachersLoading ? (
            <div className="text-center py-8 text-slate-500">Loading teachers...</div>
          ) : teachers.length === 0 ? (
            <div className="text-center py-8 text-slate-500">No teachers available. Please add teachers first.</div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Teacher Name</label>
                  <select
                    value={formData.teacher}
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        teacher: e.target.value
                      });
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
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
                  <label className="block text-sm font-medium text-slate-700 mb-2">Academic Year</label>
                <select
                  value={formData.academicYear}
                  onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                >
                  {getAcademicYears().map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Class</label>
                <select
                  value={formData.class}
                  onChange={(e) => setFormData({ ...formData, class: e.target.value, subjects: [] })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                >
                  <option value="">Select Class</option>
                  {CLASS_OPTIONS.map(cls => (
                    <option key={cls} value={cls}>{cls}</option>
                  ))}
                </select>
              </div>
            </div>

            {formData.class && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-3">
                  Subjects for Class {formData.class}
                </label>
                {subjectsLoading ? (
                  <div className="text-center py-8 text-slate-500">Loading subjects...</div>
                ) : (
                  <>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {Array.isArray(subjects) && subjects.map((subject) => (
                        <label
                          key={subject._id}
                          className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-blue-50 cursor-pointer transition-all"
                        >
                          <input
                            type="checkbox"
                            checked={formData.subjects.includes(subject._id)}
                            onChange={() => handleSubjectToggle(subject._id)}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                          />
                          <span className="text-sm text-slate-700">{subject.name}</span>
                        </label>
                      ))}
                    </div>
                    {subjects.length === 0 && (
                      <p className="text-sm text-slate-500">No subjects available for this class.</p>
                    )}
                  </>
                )}
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                className="px-6 py-2.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors font-medium"
              >
                {editing ? 'Update Assignment' : 'Create Assignment'}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="px-6 py-2.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors font-medium"
              >
                Cancel
              </button>
            </div>
          </form>
          )}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-semibold text-slate-900">All Assignments</h2>
            <div className="relative">
              <input
                type="text"
                placeholder="Search assignments..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full sm:w-64 pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
              />
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Teacher ID</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Teacher Name</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Class</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Subjects</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Academic Year</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                    Loading...
                  </td>
                </tr>
              ) : paginatedAssignments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                    {searchTerm ? 'No assignments found matching your search.' : 'No assignments found.'}
                  </td>
                </tr>
              ) : (
                paginatedAssignments.map((assignment) => (
                  <tr key={assignment._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium text-slate-900">{assignment.teacher?.employeeId || assignment.teacherId}</td>
                    <td className="px-4 py-3 text-sm text-slate-700">{assignment.teacherName}</td>
                    <td className="px-4 py-3 text-sm text-slate-700">{assignment.className}</td>
                    <td className="px-4 py-3 text-sm text-slate-700">
                      <div className="flex flex-wrap gap-1">
                        {assignment.subjectNames?.map((name, idx) => (
                          <span key={idx} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                            {name}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-700">{assignment.academicYear}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                        assignment.status === 'active' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-slate-100 text-slate-700'
                      }`}>
                        {assignment.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(assignment)}
                          className="text-blue-600 hover:text-blue-800 font-medium"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(assignment._id)}
                          className="text-red-600 hover:text-red-800 font-medium"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-slate-200 flex items-center justify-between">
            <div className="text-sm text-slate-600">
              Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredAssignments.length)} of {filteredAssignments.length} assignments
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 rounded border border-slate-300 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
              >
                Previous
              </button>
              <span className="px-3 py-1 text-sm text-slate-600">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 rounded border border-slate-300 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
