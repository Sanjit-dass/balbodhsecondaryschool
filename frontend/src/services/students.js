import api from './api';

export const fetchStudents = async (params = {}) => {
  const res = await api.get('/students', { params });
  return res.data;
};

export const fetchStudentById = async (id) => {
  if (!id) throw new Error('student id is required');
  const res = await api.get(`/students/${id}`);
  return res.data;
};

export default { fetchStudents, fetchStudentById };
