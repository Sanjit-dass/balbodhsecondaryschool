import React, { useContext, useState } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import StudentProfile from './StudentProfile';
import { useLocation } from 'react-router-dom';
import api from '../services/api';

export default function StudentFees() {
  const { user } = useContext(AuthContext);
  const location = useLocation();
  const role = String(user?.role || '').toLowerCase();
  const studentId = role === 'student'
    ? user?._id || user?.id
    : role === 'parent'
      ? user?.studentId || user?.student?._id || user?.student?.id
      : null;

  // Claim form state
  const [claimLoading, setClaimLoading] = useState(false);
  const [claimMatches, setClaimMatches] = useState(null);
  const [claimError, setClaimError] = useState(null);
  const [claimSuccess, setClaimSuccess] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);

  // load persisted selection
  React.useEffect(() => {
    try {
      const raw = localStorage.getItem('selectedStudent');
      if (raw) setSelectedStudent(JSON.parse(raw));
    } catch (e) {}
  }, []);

  if (!user) {
    return (
      <div className="p-6">
        <div className="rounded-[2rem] border border-rose-200 bg-rose-50 p-8 shadow-sm">
          <div className="text-lg font-semibold text-rose-700">⚠️ Authentication Error</div>
          <p className="mt-2 text-sm text-slate-700">User information is not available. Please log in again.</p>
        </div>
      </div>
    );
  }

  const params = new URLSearchParams(location.search);
  const showClaim = params.get('showClaim') === '1';
  const queryClaimName = params.get('name') || '';
  const queryClaimClass = params.get('className') || '';
  const queryClaimRoll = params.get('rollNumber') || '';

  const [claimName, setClaimName] = useState(queryClaimName);
  const [claimClass, setClaimClass] = useState(queryClaimClass);
  const [claimRoll, setClaimRoll] = useState(queryClaimRoll);

  React.useEffect(() => {
    if (!showClaim) return;
    setClaimName(queryClaimName);
    setClaimClass(queryClaimClass);
    setClaimRoll(queryClaimRoll);
  }, [queryClaimName, queryClaimClass, queryClaimRoll, showClaim]);

  // If showClaim=1, display ONLY the claim form
  if (showClaim && (role === 'student' || role === 'parent')) {
    return (
      <div className="p-6">
        <div className="mb-6 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-3xl font-semibold text-slate-900">Fee Portal</h1>
          <p className="mt-2 text-sm text-slate-500">Claim your student record to access fees.</p>
        </div>

        <div className="max-w-2xl mx-auto">
          {selectedStudent ? (
            <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
              <h3 className="text-lg font-semibold mb-4 text-slate-900">Selected Student</h3>
              <div className="mb-4">
                <div className="font-semibold">{selectedStudent.name || 'Unnamed'}</div>
                <div className="text-sm text-slate-500">Class: {selectedStudent.className || ''} • Roll: {selectedStudent.rollNumber || ''}</div>
              </div>
              {selectedStudent.id ? (
                <div>
                  <StudentProfile studentId={selectedStudent.id} />
                  <div className="mt-4 flex gap-3">
                    <button
                      onClick={async () => {
                        // perform claim action (ownership) using backend
                        setClaimLoading(true); setClaimError(null); setClaimSuccess(null);
                        try {
                          const res = await api.post('/fees/student/claim', { studentId: selectedStudent.id });
                          if (res.data && res.data.student) {
                            setClaimSuccess('Student claimed successfully.');
                          } else {
                            setClaimError(res.data?.message || 'Claim failed');
                          }
                        } catch (err) {
                          console.error(err);
                          setClaimError(err?.response?.data?.message || err.message || 'Claim failed');
                        } finally { setClaimLoading(false); }
                      }}
                      className="px-4 py-2 bg-emerald-600 text-white rounded font-semibold"
                    >
                      {claimLoading ? 'Claiming...' : 'Claim Student'}
                    </button>
                    <button
                      onClick={() => {
                        setSelectedStudent(null); localStorage.removeItem('selectedStudent'); setClaimMatches(null); setClaimSuccess(null); setClaimError(null);
                      }}
                      className="px-4 py-2 bg-slate-200 text-slate-700 rounded font-medium"
                    >
                      Clear Selection
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-rose-600 bg-rose-50 p-3 rounded">This record is not linked to a student profile. Please contact administration to link it.</div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
              <h3 className="text-lg font-semibold mb-4 text-slate-900">Claim Your Student Record</h3>
              <p className="text-sm text-slate-600 mb-4">Enter the student's name, class and roll/admission number to link your account.</p>
              
              <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-3">
                  <input 
                    value={claimName} 
                    onChange={(e)=>setClaimName(e.target.value)} 
                    placeholder="Student full name (optional)" 
                    className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" 
                  />
                  <select 
                    value={claimClass} 
                    onChange={(e)=>setClaimClass(e.target.value)} 
                    className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Select class</option>
                    <option value="nursery">Nursery</option>
                    <option value="lkg">LKG</option>
                    <option value="ukg">UKG</option>
                    {Array.from({length:10}).map((_,i)=> <option key={i} value={String(i+1)}>{i+1}</option>)}
                  </select>
                  <input 
                    value={claimRoll} 
                    onChange={(e)=>setClaimRoll(e.target.value)} 
                    placeholder="Roll / Admission No" 
                    className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" 
                  />
                </div>

                <div className="flex items-center gap-3">
                  <button
                    disabled={claimLoading || !claimClass || !claimRoll}
                    onClick={async () => {
                      if (!claimClass || !claimRoll) {
                        setClaimError('Please select a class and enter the roll/admission number before searching.');
                        setClaimSuccess(null);
                        setClaimMatches(null);
                        return;
                      }
                      setClaimError(null); setClaimSuccess(null); setClaimMatches(null); setClaimLoading(true);
                      try {
                        // First perform a public lookup by class+roll to surface payments/receipts
                        const lookup = await api.post('/fees/public/fetch', { className: claimClass, rollNumber: claimRoll });
                        if (lookup && lookup.data && lookup.data.success) {
                          const payments = lookup.data.payments || [];
                          const receipts = lookup.data.receipts || [];
                          if ((payments.length + receipts.length) === 0) {
                            setClaimError('No fee records found for the provided Class and Roll.');
                          } else {
                            // Prefer canonical studentId returned by the lookup API; fallback to sample records
                            const sample = payments[0] || receipts[0] || {};
                            const candidate = {
                              id: lookup.data.studentId || sample.studentId || null,
                              name: lookup.data.studentName || sample.studentName || claimName || 'Unknown',
                              className: lookup.data.className || sample.className || claimClass,
                              rollNumber: lookup.data.rollNumber || sample.rollNumber || claimRoll
                            };
                            setClaimMatches([candidate]);
                            setClaimError('Found fee records — select the candidate to claim (if studentId is present).');
                          }
                        } else {
                          setClaimError(lookup?.data?.message || 'Lookup failed');
                        }
                      } catch (err) {
                        console.error(err);
                        setClaimError(err?.response?.data?.message || err.message || 'Lookup failed');
                      } finally { setClaimLoading(false); }
                    }}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition disabled:opacity-50"
                  >
                    {claimLoading ? 'Searching...' : 'Search & Claim'}
                  </button>
                </div>

                {claimError ? <div className="text-sm text-rose-600 bg-rose-50 p-3 rounded">{claimError}</div> : null}
                {claimSuccess ? <div className="text-sm text-emerald-600 bg-emerald-50 p-3 rounded">{claimSuccess}</div> : null}

                {claimMatches ? (
                  <div>
                    <div className="text-sm text-slate-600 mb-3 font-semibold">Select the correct student to claim:</div>
                    <div className="space-y-2">
                      {claimMatches.map(m => (
                        <div key={m.id || (m.className+'-'+m.rollNumber)} className="flex items-center justify-between border border-slate-200 p-3 rounded">
                          <div>
                            <div className="font-semibold text-slate-900">{m.name || 'Unnamed'}</div>
                            <div className="text-xs text-slate-500">Class: {m.className} • Roll: {m.rollNumber}</div>
                          </div>
                          <button
                            onClick={() => {
                              if (!m.id) { setClaimError('This record is not linked to a student profile. Please contact administration to link it.'); return; }
                              // lock selection locally and persist. Do not unmount or redirect.
                              setSelectedStudent(m);
                              try { localStorage.setItem('selectedStudent', JSON.stringify(m)); } catch(e){}
                              setClaimSuccess('Student selected. Fee dashboard will appear below.');
                            }}
                            disabled={!m.id}
                            className={`px-3 py-1 ${m.id ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-slate-200 text-slate-600 cursor-not-allowed'} rounded text-sm font-semibold transition`}
                          >
                            {m.id ? 'Select' : 'Not linkable'}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Otherwise, show the fee portal with student profile
  return (
    <div className="p-6">
      <div className="mb-6 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-3xl font-semibold text-slate-900">Fee Portal</h1>
        <p className="mt-2 text-sm text-slate-500">View your fee dashboard, payment history, pending dues, and receipts in a secure read-only portal.</p>
      </div>
      {studentId ? (
        <StudentProfile studentId={studentId} />
      ) : (
        <div className="rounded-[2rem] border border-rose-200 bg-rose-50 p-8 text-rose-700 shadow-sm">
          <div className="text-lg font-semibold">⚠️ Student record unavailable</div>
          <p className="mt-2 text-sm text-slate-700">No student record found. Please contact the school administrator.</p>
        </div>
      )}
    </div>
  );
}
