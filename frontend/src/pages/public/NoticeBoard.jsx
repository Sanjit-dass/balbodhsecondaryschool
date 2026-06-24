import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaDownload, FaCalendarAlt } from 'react-icons/fa';
import { SectionTitle } from '../../components/public/SectionComponents';
import TranslateText from '../../components/public/TranslateText';
import { COLORS } from '../../constants/schoolData';
import api, { apiBaseURL } from '../../services/api';
import { useContext } from 'react';
import { AuthContext } from '../../contexts/AuthContext';
import { getInlineViewUrl } from '../../services/fileViewService';

const NoticeBoard = () => {
  const [notices, setNotices] = useState([]);
  const [documents, setDocuments] = useState([]);
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    return isNaN(date) ? 'Unknown' : date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  useEffect(() => {
    let eventSource;

    const fetchNotices = async () => {
      try {
        const response = await api.get('/notices/public');
        setNotices(response.data.notices || []);
        setError(null);
      } catch (err) {
        console.error(err);
        setError('Unable to load public notices.');
      } finally {
        setLoading(false);
      }
    };

    const fetchDocuments = async () => {
      try {
        const response = await api.get('/uploads/public');
        setDocuments(response.data.documents || []);
      } catch (err) {
        console.error('Unable to load public documents.', err);
      }
    };

    fetchNotices();
    fetchDocuments();

    if (window.EventSource) {
      try {
        eventSource = new EventSource(`${apiBaseURL}/notices/stream`);
      } catch (e) {
        console.warn('Unable to initialize noticeboard EventSource:', e);
      }
      eventSource.onmessage = (event) => {
        try {
          const notice = JSON.parse(event.data);
          setNotices((prev) => [notice, ...prev]);
        } catch (e) {
          console.error('Failed to parse notice stream', e);
        }
      };
      eventSource.onerror = () => {
        if (eventSource) eventSource.close();
      };
    }

    return () => {
      if (eventSource) eventSource.close();
    };
  }, []);

  const filteredNotices = [...notices];

  // sort: pinned first, then priority (Urgent, High, Medium, Low), then newest first
  const priorityOrder = { 'Urgent': 0, 'High': 1, 'Medium': 2, 'Low': 3 };
  filteredNotices.sort((a,b)=>{
    if((b.pinned?1:0) - (a.pinned?1:0) !== 0) return (b.pinned?1:0) - (a.pinned?1:0);
    const pa = priorityOrder[a.priority] ?? 2;
    const pb = priorityOrder[b.priority] ?? 2;
    if(pa !== pb) return pa - pb;
    const da = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
    const db = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
    return db - da;
  });

  return (
    <TranslateText>
      <div>
      {/* Page Header */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="bg-gradient-to-r from-blue-900 to-blue-700 text-white py-16 md:py-24"
      >
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Notice Board</h1>
          <p className="text-lg text-blue-100">
            Stay updated with important announcements and information
          </p>
        </div>
      </motion.section>

      {/* Search removed per request */}

      {/* Notices List */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <SectionTitle
            title="Latest Notices"
            subtitle={`Showing ${filteredNotices.length} notices`}
            className="bg-white rounded-lg p-6 shadow-lg hover:shadow-xl transition-all"
          />

          {loading ? (
            <div className="text-center py-16">
              <p className="text-lg font-semibold text-gray-700">Loading notices...</p>
            </div>
          ) : error ? (
            <div className="text-center py-16">
              <p className="text-lg font-semibold text-rose-600">{error}</p>
            </div>
          ) : filteredNotices.length > 0 ? (
            <div className="space-y-4">
              {filteredNotices.map((notice, index) => (
                <motion.div
                  key={notice._id || index}
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.05 }}
                  viewport={{ once: true }}
                  whileHover={{ x: 10 }}
                  className="bg-white border-l-4 border-blue-600 rounded-lg p-6 shadow-lg hover:shadow-xl transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900">{notice.title}</h3>
                    </div>
                    <span className="text-xs font-semibold text-white px-3 py-1 rounded-full bg-blue-600 whitespace-nowrap ml-4">
                      {notice.category || 'General'}
                    </span>
                  </div>

                  <p className="text-gray-600 mb-4 line-clamp-2">{notice.body || notice.content || 'No description available.'}</p>
                  {notice.attachments && notice.attachments.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-3">
                      {notice.attachments.map((a, i) => {
                        const url = a?.fileUrl || a?.url || a;
                        const lower = (url || '').toLowerCase();
                        const isImage = /\.(jpg|jpeg|png|gif|webp|bmp)(\?|$)/.test(lower);
                        return isImage ? (
                          <a key={i} href={getInlineViewUrl(url)} target="_blank" rel="noreferrer" className="block">
                            <img src={getInlineViewUrl(url)} alt={`notice-attachment-${i}`} className="max-w-[200px] max-h-40 object-cover rounded" />
                          </a>
                        ) : (
                          <a key={i} href={getInlineViewUrl(url)} target="_blank" rel="noreferrer" className="px-3 py-1 bg-gray-100 rounded text-sm text-blue-600">Download</a>
                        );
                      })}
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <FaCalendarAlt size={14} />
                      {formatDate(notice.publishedAt || notice.date)}
                    </div>
                    <div className="flex gap-2">
                        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="text-blue-600 font-semibold hover:text-blue-800 transition">Read More →</motion.button>

                        <motion.button onClick={() => {
                          // Print notice
                          const w = window.open('', '_blank');
                          if(!w) return;
                          w.document.write(`<html><head><title>${notice.title}</title></head><body><h1>${notice.title}</h1><p><em>${notice.category}</em></p><div>${(notice.body||'')}</div></body></html>`);
                          w.document.close();
                          w.focus();
                          w.print();
                        }} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="text-gray-600 hover:text-gray-800 transition">📄 Print</motion.button>

                        <motion.button onClick={() => {
                          // simple download as txt
                          const blob = new Blob([`${notice.title}\n\n${notice.body || ''}`], { type: 'text/plain' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a'); a.href = url; a.download = `${(notice.title||'notice').replace(/\s+/g,'_')}.txt`; a.click(); URL.revokeObjectURL(url);
                        }} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="text-gray-600 hover:text-gray-800 transition"> <FaDownload size={18} /> </motion.button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <p className="text-xl text-gray-600">
                No notices found matching your search.
              </p>
            </motion.div>
          )}
        </div>
      </section>

      {/* Important Links */}
      <section className="py-16 md:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <SectionTitle
            title="Important Documents"
            subtitle="Download frequently accessed documents"
          />

          {documents && documents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {documents.map((doc, index) => (
                <motion.div
                  key={doc._id || doc.id || index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  whileHover={{ y: -5 }}
                  className="bg-white rounded-lg p-6 shadow-lg hover:shadow-xl transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-bold text-gray-900">{doc.title || doc.originalName || 'Document'}</h3>
                      <p className="text-sm text-gray-600">
                        {(doc.mimetype ? doc.mimetype.split('/').pop().toUpperCase() : ((doc.originalName || '').split('.').pop() || 'PDF').toUpperCase())}
                        {doc.size ? ` • ${Math.round(doc.size / 1024)} KB` : ''}
                      </p>
                    </div>
                    <FaDownload className="text-blue-600 text-lg" />
                  </div>
                  <motion.a
                    href={doc.fileUrl || doc.url}
                    target="_blank"
                    rel="noreferrer"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-full inline-block text-center py-2 rounded-lg font-semibold text-white transition-all text-sm"
                    style={{ backgroundColor: COLORS.secondary }}
                  >
                    Download
                  </motion.a>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="max-w-4xl mx-auto bg-white rounded-lg p-8 text-center shadow">
              <p className="text-lg text-gray-700 mb-4">No documents are available yet.</p>
              {user && (user.role === 'admin' || user.role === 'superadmin' || user.role === 'principal') ? (
                <div>
                  <p className="text-sm text-gray-500 mb-3">As an admin you can upload documents from the admin panel.</p>
                  <a href="/admin/uploads" className="inline-block px-4 py-2 bg-indigo-600 text-white rounded">Go to Uploads</a>
                </div>
              ) : (
                <p className="text-sm text-gray-500">Please contact the school administration to add documents.</p>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Subscribe for Updates */}
      <section className="py-16 md:py-24 bg-gradient-to-r from-blue-900 to-blue-700 text-white">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="max-w-7xl mx-auto px-4 text-center"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Stay Updated
          </h2>
          <p className="text-lg text-blue-100 mb-8 max-w-2xl mx-auto">
            Subscribe to receive important notices and updates directly to your email
          </p>
          <div className="flex flex-col md:flex-row gap-4 max-w-xl mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-6 py-3 rounded-lg text-gray-900 focus:outline-none focus:ring-2"
              style={{ '--tw-ring-color': COLORS.secondary }}
            />
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-3 rounded-lg font-bold text-white transition-all"
              style={{ backgroundColor: COLORS.accent, color: '#000' }}
            >
              Subscribe
            </motion.button>
          </div>
        </motion.div>
      </section>
    </div>
    </TranslateText>
  );
};

export default NoticeBoard;
