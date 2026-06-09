import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import api from '../services/api';
import { getInlineViewUrl } from '../services/fileViewService';
import AssignmentForm from '../components/AssignmentForm';
import FileUploader from '../components/FileUploader';
import PDFViewer from '../components/PDFViewer';

export default function Assignments(){
  const { user } = useContext(AuthContext);
  const [items, setItems] = useState([]);
  const [editing, setEditing] = useState(null);
  const [assignmentFormKey, setAssignmentFormKey] = useState(0);
  const [selected, setSelected] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [submissionText, setSubmissionText] = useState('');
  const [submissionAttachments, setSubmissionAttachments] = useState([]);
  const [submissions, setSubmissions] = useState({});
  const [latestSubmissions, setLatestSubmissions] = useState({});
  const [message, setMessage] = useState('');
  const [editingSubmissionId, setEditingSubmissionId] = useState(null);
  const [editingContent, setEditingContent] = useState('');
  const [editingAttachments, setEditingAttachments] = useState([]);
  const [gradingSubmissionId, setGradingSubmissionId] = useState(null);
  const [gradingGrade, setGradingGrade] = useState('');
  const [gradingFeedback, setGradingFeedback] = useState('');

  useEffect(()=>{
    if (!user) return;
    fetch();
  },[user]);

  const fetch = async () => {
    try {
      const res = await api.get('/assignments');
      const assignmentList = res.data.assignments || [];
      setItems(assignmentList);
      if (isStudent) {
        loadStudentAssignmentResults(assignmentList);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadStudentAssignmentResults = async (assignmentList) => {
    const latest = {};
    await Promise.all(assignmentList.map(async (assignment) => {
      try {
        const res = await api.get(`/assignments/${assignment._id}/submissions`);
        const submissionsForAssignment = res.data.submissions || [];
        if (submissionsForAssignment.length > 0) {
          latest[assignment._id] = [...submissionsForAssignment].sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt))[0];
        }
      } catch (err) {
        console.error(err);
      }
    }));
    setLatestSubmissions(prev => ({ ...prev, ...latest }));
  };

  const remove=async(id)=>{ if(!window.confirm('Delete assignment?')) return; try{ await api.delete(`/assignments/${id}`); fetch(); }catch(err){console.error(err);} };

  const handleNewAssignment = () => {
    setEditing(null);
    setSelected(null);
    setMessage('');
    setAssignmentFormKey((prev) => prev + 1);
  };

  const isStudent = user?.role === 'student';
  const selectedSubmissions = selected ? submissions[selected._id] || [] : [];
  const latestSubmission = selectedSubmissions.length
    ? [...selectedSubmissions].sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt))[0]
    : null;

  const handleOpenSubmit = async (assignment) => {
    setSelected(assignment);
    setMessage('');
    if (!assignment) return;
    try {
      const res = await api.get(`/assignments/${assignment._id}/submissions`);
      const assignmentSubmissions = res.data.submissions || [];
      setSubmissions(prev => ({ ...prev, [assignment._id]: assignmentSubmissions }));
      if (assignmentSubmissions.length > 0) {
        const latest = [...assignmentSubmissions].sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt))[0];
        setLatestSubmissions(prev => ({ ...prev, [assignment._id]: latest }));
      }
      setSubmissionAttachments([]);
      // reset edit state
      setEditingSubmissionId(null);
      setEditingContent('');
      setEditingAttachments([]);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async () => {
    if (!selected) return;
    try {
      await api.post(`/assignments/${selected._id}/submissions`, { content: submissionText, attachments: submissionAttachments });
      setMessage('Assignment submitted successfully.');
      setSubmissionText('');
      setSubmissionAttachments([]);
      handleOpenSubmit(selected);
    } catch (err) {
      console.error(err);
      setMessage('Submission failed. Please try again.');
    }
  };

  const handleEditStart = (item) => {
    setEditingSubmissionId(item._id);
    setEditingContent(item.content || '');
    setEditingAttachments(item.attachments || []);
  };

  const handleEditSave = async (assignmentId) => {
    if(!editingSubmissionId) return;
    try{
      await api.put(`/assignments/${assignmentId}/submissions/${editingSubmissionId}`, { content: editingContent, attachments: editingAttachments });
      setMessage('Submission updated');
      setEditingSubmissionId(null); setEditingContent(''); setEditingAttachments([]);
      handleOpenSubmit(selected);
    }catch(err){ console.error(err); setMessage('Update failed'); }
  };

  const handleSubmissionDelete = async (assignmentId, submissionId) => {
    if(!window.confirm('Delete this submission?')) return;
    try{
      await api.delete(`/assignments/${assignmentId}/submissions/${submissionId}`);
      setMessage('Submission deleted');
      handleOpenSubmit(selected);
    }catch(err){ console.error(err); setMessage('Delete failed'); }
  };

  const handleGradeSave = async (assignmentId, item, grade, feedback) => {
    try{
      await api.put(`/assignments/${assignmentId}/submissions/${item._id}`, { grade, feedback, status: 'graded' });
      setMessage('Grade saved');
      handleOpenSubmit(selected);
    }catch(err){ console.error(err); setMessage('Failed to save grade'); }
  };

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Assignments</h1>
          <p className="text-sm text-slate-600">{isStudent ? 'View assignments and submit your work here.' : 'Create, manage, and publish assignments.'}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {!isStudent && <button onClick={handleNewAssignment} className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-500">New Assignment</button>}
        </div>
      </div>

      {!isStudent && <AssignmentForm key={assignmentFormKey} existing={editing} onSaved={()=>{ setEditing(null); fetch(); }} />}

      <div className="grid gap-4">
        {items.map(a=> (
          <div key={a._id} className="p-4 bg-white shadow rounded">
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-start">
              <div className="flex-1">
                <div className="font-bold text-lg">{a.title}</div>
                <div className="text-sm text-slate-600">Due: {a.dueDate ? new Date(a.dueDate).toLocaleDateString() : 'Not set'}</div>
                <div className="text-sm text-slate-600">Assigned by: {a.createdBy?.name || (a.createdBy ? a.createdBy : 'Teacher')}</div>
                {a.totalMarks !== undefined && a.totalMarks !== null && <div className="text-sm text-slate-600">Total Marks: {a.totalMarks}</div>}
                <div className="mt-2 text-sm text-slate-700">{a.description || 'No description available.'}</div>
                
                {/* Show teacher-uploaded attachments for students */}
                {isStudent && a.attachments && a.attachments.length > 0 && (
                  <div className="mt-3 p-3 bg-blue-50 rounded border border-blue-200">
                    <div className="text-sm font-semibold text-blue-900 mb-2">📎 Teacher Materials</div>
                    <div className="space-y-2">
                      {a.attachments.map((att, idx) => (
                        <div key={idx}>
                          <div className="flex items-center gap-2">
                            <a href={getInlineViewUrl(att.fileUrl || att.url)} target="_blank" rel="noreferrer" className="text-sm text-blue-600 hover:underline break-all">
                              📄 {att.fileName || att.fileUrl?.split('/').pop() || att.url?.split('/').pop() || att.publicId || `Document ${idx + 1}`}
                            </a>
                          </div>
                          <PDFViewer fileUrl={att.fileUrl || att.url} fileName={att.fileName} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {isStudent ? (
                  <button onClick={()=>handleOpenSubmit(a)} className="px-4 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-500 whitespace-nowrap">Submit Assignment</button>
                ) : (
                  <>
                    <button onClick={()=>handleOpenSubmit(a)} className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700 whitespace-nowrap">👁️ View Submissions</button>
                    <button onClick={()=>setEditing(a)} className="px-4 py-2 rounded bg-yellow-400 text-slate-900 hover:bg-yellow-500">Edit</button>
                    <button onClick={()=>remove(a._id)} className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700">Delete</button>
                  </>
                )}
              </div>
            </div>
            {isStudent && latestSubmissions[a._id] && (
              <div className="mt-4 rounded border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
                <div className="font-semibold mb-1">Result</div>
                <div>Status: <span className="font-semibold">{latestSubmissions[a._id].status || 'submitted'}</span></div>
                <div>Grade: <span className="font-semibold">{latestSubmissions[a._id].grade ?? 'Not graded yet'}</span></div>
                <div>Feedback: <span className="font-semibold">{latestSubmissions[a._id].feedback || 'No feedback yet'}</span></div>
              </div>
            )}
            {isStudent && selected?._id === a._id && (
              <div className="mt-4 rounded border-2 border-indigo-300 bg-indigo-50 p-4">
                <div className="font-bold text-lg text-indigo-900 mb-3">📝 Submit Your Assignment</div>
                {latestSubmission && (
                  <div className="mb-4 rounded border border-slate-300 bg-white p-3 text-sm">
                    <div className="font-semibold text-slate-800 mb-2">✓ Latest Submission</div>
                    <div className="text-slate-700">Status: <span className="font-semibold">{latestSubmission.status || 'submitted'}</span></div>
                    <div className="text-slate-700">Grade: <span className="font-semibold">{latestSubmission.grade ?? 'Not graded yet'}</span></div>
                    <div className="text-slate-700">Feedback: <span className="font-semibold">{latestSubmission.feedback || 'No feedback yet'}</span></div>
                  </div>
                )}
                
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Your Response (optional text)</label>
                  <textarea value={submissionText} onChange={e=>setSubmissionText(e.target.value)} rows={4} className="w-full rounded border border-slate-300 p-2" placeholder="Write your submission details, comments, or paste a link here..." />
                </div>

                <div className="mb-4 bg-white p-3 rounded border border-slate-300">
                  <label className="block text-sm font-semibold text-slate-700 mb-3">📤 Upload Your Work</label>
                  <FileUploader folder={`assignments/${a._id}/submissions`} accept="image/*,application/pdf,.doc,.docx" onUploaded={(data)=>{ setSubmissionAttachments(s=>[...s, { fileUrl: data.fileUrl || data.url, publicId: data.publicId, fileName: data.originalName || data.fileName }]); }} />
                  {submissionAttachments.length > 0 && (
                    <div className="mt-3">
                      <div className="text-sm font-semibold text-slate-700 mb-2">Uploaded Files:</div>
                      <div className="space-y-2">
                        {submissionAttachments.map((att,i)=>(
                          <div key={i}>
                            <div className="flex items-center justify-between bg-slate-100 p-2 rounded border border-slate-300">
                              <a href={getInlineViewUrl(att.fileUrl || att.url)} target="_blank" rel="noreferrer" className="text-sm text-blue-600 hover:underline flex-1 break-all">
                                ✓ {att.fileName || att.fileUrl?.split('/').pop() || att.url?.split('/').pop() || att.publicId || att.fileUrl}
                              </a>
                              <button type="button" onClick={()=>setSubmissionAttachments(s=>s.filter((_,idx)=>idx!==i))} className="text-sm text-red-600 hover:text-red-800 font-semibold ml-2 whitespace-nowrap">Remove</button>
                            </div>
                            <PDFViewer fileUrl={att.fileUrl || att.url} fileName={att.fileName} />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button onClick={handleSubmit} className="px-6 py-2 rounded bg-emerald-600 text-white hover:bg-emerald-700 font-semibold">✓ Submit Assignment</button>
                  <button onClick={()=>setSelected(null)} className="px-4 py-2 rounded bg-slate-300 text-slate-700 hover:bg-slate-400">Cancel</button>
                </div>
                
                {message && <div className="mt-3 p-2 rounded bg-white text-sm text-slate-700 border border-slate-300">{message}</div>}
                
                {submissions[a._id]?.length > 0 && (
                  <div className="mt-4 border-t border-slate-300 pt-4">
                    <div className="font-semibold text-slate-800 mb-2">📋 Previous Submissions</div>
                    {submissions[a._id].map(item => (
                      <div key={item._id} className="mt-2 rounded border border-slate-200 bg-white p-3">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="text-sm font-medium text-slate-700">Submitted: {new Date(item.submittedAt).toLocaleDateString()}</div>
                            {item.content && <div className="text-sm text-slate-600 mt-1">{item.content}</div>}
                            {item.attachments && item.attachments.length > 0 && (
                              <div className="mt-2">
                                <div className="text-sm font-semibold text-slate-700">Files:</div>
                                {item.attachments.map((att, idx) => (
                                  <div key={idx}>
                                    <div className="text-sm"><a href={getInlineViewUrl(att.fileUrl || att.url)} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">📄 {att.fileName || att.fileUrl?.split('/').pop() || att.url?.split('/').pop() || att.publicId || att.fileUrl || `File ${idx + 1}`}</a></div>
                                    <PDFViewer fileUrl={att.fileUrl || att.url} fileName={att.fileName} />
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col gap-2 ml-4 whitespace-nowrap">
                            {/* Student actions */}
                            {user?.role === 'student' && String(item.student?._id || item.student) === String(user._id) && (
                              <>
                                <button className="px-3 py-1 bg-yellow-300 rounded text-sm hover:bg-yellow-400" onClick={()=>handleEditStart(item)}>Edit</button>
                                <button className="px-3 py-1 bg-rose-600 text-white rounded text-sm hover:bg-rose-700" onClick={()=>handleSubmissionDelete(a._id, item._id)}>Delete</button>
                              </>
                            )}
                            {/* Teacher actions: grade/delete */}
                            {user?.role !== 'student' && (
                              <>
                                <div className="text-sm">Grade: {item.grade || '-'}</div>
                                <div className="text-sm">Feedback: {item.feedback || '-'}</div>
                                <button className="px-3 py-1 bg-rose-600 text-white rounded text-sm hover:bg-rose-700" onClick={()=>handleSubmissionDelete(a._id, item._id)}>Delete</button>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Inline edit form for students */}
                        {editingSubmissionId === item._id && (
                          <div className="mt-3 bg-slate-50 p-3 rounded">
                            <textarea value={editingContent} onChange={e=>setEditingContent(e.target.value)} rows={3} className="w-full rounded border p-2" />
                            <div className="mt-2">
                              <label className="block text-sm text-slate-600 mb-2">Update attachments</label>
                              <FileUploader folder={`assignments/${a._id}/submissions`} accept="image/*,application/pdf,.doc,.docx" onUploaded={(data)=>{ setEditingAttachments(s=>[...s, { fileUrl: data.fileUrl || data.url, publicId: data.publicId, fileName: data.originalName || data.fileName }]); }} />
                              <div className="mt-2 space-y-2">
                                {editingAttachments.map((att,i)=>(
                                  <div key={i}>
                                    <div className="flex items-center justify-between bg-white p-2 rounded border">
                                      <a href={getInlineViewUrl(att.fileUrl || att.url || (typeof att === 'string' ? att : undefined))} target="_blank" rel="noreferrer" className="text-sm text-blue-600">{att.fileName || att.fileUrl?.split('/').pop() || att.url?.split('/').pop() || att.publicId || att.fileUrl}</a>
                                      <button type="button" onClick={()=>setEditingAttachments(s=>s.filter((_,idx)=>idx!==i))} className="text-sm text-red-600">Remove</button>
                                    </div>
                                    <PDFViewer fileUrl={att.fileUrl || att.url} fileName={att.fileName} />
                                  </div>
                                ))}
                              </div>
                            </div>
                            <div className="mt-2 flex gap-2">
                              <button className="px-3 py-1 bg-indigo-600 text-white rounded" onClick={()=>handleEditSave(a._id)}>Save</button>
                              <button className="px-3 py-1 bg-slate-200 rounded" onClick={()=>{ setEditingSubmissionId(null); setEditingContent(''); setEditingAttachments([]); }}>Cancel</button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {!isStudent && selected?._id === a._id && (
              <div className="mt-4 rounded border-2 border-green-300 bg-green-50 p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="font-bold text-lg text-green-900">📊 Student Submissions</div>
                  <button onClick={()=>setSelected(null)} className="px-3 py-1 rounded bg-slate-300 text-slate-700 hover:bg-slate-400 text-sm">Close</button>
                </div>
                
                {!submissions[a._id] || submissions[a._id].length === 0 ? (
                  <div className="p-4 rounded bg-white border border-slate-200">
                    <p className="text-sm text-slate-600">No submissions yet.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {submissions[a._id]?.map(item => (
                      <div key={item._id} className="rounded border border-slate-300 bg-white p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <div className="font-semibold text-slate-900">{item.student?.name || item.student?.fullName || 'Student'}</div>
                            <div className="text-sm text-slate-600">Submitted: {new Date(item.submittedAt).toLocaleString()}</div>
                          </div>
                          <div className="flex gap-1">
                            <span className="px-2 py-1 text-xs font-semibold rounded" style={{backgroundColor: item.grade ? '#dcfce7' : '#fef3c7', color: item.grade ? '#166534' : '#92400e'}}>
                              {item.grade ? `Grade: ${item.grade}` : 'Not Graded'}
                            </span>
                          </div>
                        </div>

                        {item.content && (
                          <div className="mb-3 p-2 rounded bg-slate-50 border border-slate-200">
                            <div className="text-sm font-semibold text-slate-700 mb-1">Student's Response:</div>
                            <div className="text-sm text-slate-700">{item.content}</div>
                          </div>
                        )}

                        {item.attachments && item.attachments.length > 0 && (
                          <div className="mb-3 p-2 rounded bg-blue-50 border border-blue-200">
                            <div className="text-sm font-semibold text-blue-900 mb-2">📎 Uploaded Files:</div>
                            <div className="space-y-1">
                              {item.attachments.map((att, idx) => (
                                <div key={idx}>
                                  <a href={getInlineViewUrl(att.fileUrl || att.url || (typeof att === 'string' ? att : undefined))} target="_blank" rel="noreferrer" className="text-sm text-blue-600 hover:underline break-all">
                                    📄 {att.fileUrl?.split('/').pop() || att.fileUrl}
                                  </a>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {item.feedback && (
                          <div className="mb-3 p-2 rounded bg-purple-50 border border-purple-200">
                            <div className="text-sm font-semibold text-purple-900">Your Feedback:</div>
                            <div className="text-sm text-purple-900">{item.feedback}</div>
                          </div>
                        )}

                        {gradingSubmissionId === item._id ? (
                          <div className="bg-amber-50 p-3 rounded border border-amber-200">
                            <div className="font-semibold text-amber-900 mb-3">✏️ Add/Edit Grade & Feedback</div>
                            <div className="mb-3">
                              <label className="block text-sm font-semibold text-slate-700 mb-1">Grade/Marks (e.g., 85, A, Pass)</label>
                              <input type="text" value={gradingGrade} onChange={e=>setGradingGrade(e.target.value)} className="w-full rounded border border-slate-300 p-2" placeholder="Enter grade or marks" />
                            </div>
                            <div className="mb-3">
                              <label className="block text-sm font-semibold text-slate-700 mb-1">Feedback for Student</label>
                              <textarea value={gradingFeedback} onChange={e=>setGradingFeedback(e.target.value)} rows={3} className="w-full rounded border border-slate-300 p-2" placeholder="Write your feedback, comments, or suggestions..." />
                            </div>
                            <div className="flex gap-2">
                              <button className="px-4 py-2 rounded bg-emerald-600 text-white hover:bg-emerald-700 font-semibold" onClick={()=>{ handleGradeSave(a._id, item, gradingGrade, gradingFeedback); setGradingSubmissionId(null); setGradingGrade(''); setGradingFeedback(''); }}>
                                ✓ Save Grade & Feedback
                              </button>
                              <button className="px-4 py-2 rounded bg-slate-300 text-slate-700 hover:bg-slate-400" onClick={()=>{ setGradingSubmissionId(null); setGradingGrade(''); setGradingFeedback(''); }}>
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            <button className="px-4 py-2 rounded bg-emerald-600 text-white text-sm hover:bg-emerald-700 font-semibold" onClick={()=>{ setGradingSubmissionId(item._id); setGradingGrade(item.grade || ''); setGradingFeedback(item.feedback || ''); }}>
                              ✏️ Add/Edit Grade & Feedback
                            </button>
                            <button className="px-4 py-2 rounded bg-red-600 text-white text-sm hover:bg-red-700" onClick={()=>handleSubmissionDelete(a._id, item._id)}>
                              🗑️ Delete
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
