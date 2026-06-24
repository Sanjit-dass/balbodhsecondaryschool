import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';
import StaffModal from '../../components/public/StaffModal';

export default function SchoolLeadership(){
  const [list, setList] = useState([]);
  const [selected, setSelected] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchList = async () => {
      try {
        const res = await axios.get('/api/staff-leadership');
        if (res.data && res.data.data) {
          const list = res.data.data;
          // only show entries that have a photo URL (avoid stale/deleted photo placeholders)
          setList(Array.isArray(list) ? list.filter(m => m && m.photo && m.photo.url) : []);
        }
      } catch (e) { console.error(e); }
    };
    fetchList();
  }, []);

  useEffect(() => {
    const q = new URLSearchParams(location.search);
    const id = q.get('staff');
    if (!id) return setSelected(null);
    const fetchOne = async () => {
      try {
        const res = await axios.get(`/api/staff-leadership/${id}`);
        if (res.data && res.data.data) setSelected(res.data.data);
      } catch (e) { console.error(e); }
    };
    fetchOne();
  }, [location.search]);

  const openStaff = (s) => {
    navigate(`/school-leadership?staff=${s._id}`);
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-4">School Leadership</h1>
      <p className="text-slate-600 mb-6">Meet our leadership team.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {list.map((s) => (
          <div key={s._id} className="bg-white dark:bg-slate-800 rounded-lg shadow p-4 flex flex-col">
            <div className="h-44 bg-slate-100 dark:bg-slate-700 rounded overflow-hidden flex items-center justify-center">
              {s.photo && s.photo.url ? (
                <img src={s.photo.url} alt={s.fullName} className="max-h-full max-w-full object-contain" />
              ) : (
                <div className="text-slate-500">No Image</div>
              )}
            </div>
            <div className="mt-3 flex-1">
              <h3 className="text-lg font-semibold">{s.fullName}</h3>
              <p className="text-sm text-slate-600">{s.designation}</p>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <button className="text-indigo-600" onClick={() => openStaff(s)}>Learn More →</button>
              <span className="text-xs text-slate-400">{s.roleCategory}</span>
            </div>
          </div>
        ))}
      </div>

      {selected && (
        <StaffModal staff={selected} onClose={() => navigate('/school-leadership')} />
      )}
    </div>
  );
}
