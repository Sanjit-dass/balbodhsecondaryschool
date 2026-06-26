import React, { useEffect, useState, useRef } from 'react';
import api from '../../services/api';

const EventModal = ({ event, onClose }) => {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    function onKey(e){ if(e.key === 'Escape') onClose && onClose(); }
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', onKey); };
  }, []);

  if (!event) return null;

  const [localEvent, setLocalEvent] = useState(event);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLocalEvent(event);
    async function fetchFull(){
      if(!event || !event._id) return;
      const needsFull = !event.fullDescription || !(event.photos && event.photos.length);
      if(!needsFull) return;
      try{
        setLoading(true);
        const res = await api.get(`/events-v2/${event._id}`);
        if(res && res.data){
          const ev = res.data;
          const photos = (ev.photos || []).map(p => ({ url: p.url || p.fileUrl || p.path, publicId: p.publicId || p.public_id || null, caption: p.caption || '' })).filter(Boolean);
          const coverPhoto = ev.coverPhoto ? ({ url: ev.coverPhoto.url || ev.coverPhoto.fileUrl || ev.coverPhoto.path, publicId: ev.coverPhoto.publicId || ev.coverPhoto.public_id || null, caption: ev.coverPhoto.caption || '' }) : (photos[0] || null);
          setLocalEvent({ ...ev, photos, coverPhoto });
        }
      }catch(err){ console.error('Failed to fetch full event', err); }
      finally{ setLoading(false); }
    }
    fetchFull();
  }, [event]);

  const current = localEvent || event;
  const photos = (current.photos && current.photos.length > 0) ? current.photos : (current.coverPhoto ? [current.coverPhoto] : []);
  const [index, setIndex] = useState(0);
  const touchStartX = useRef(null);

  useEffect(() => { setIndex(0); }, [event]);

  function next(){ if(photos.length === 0) return; setIndex(i => (i + 1) % photos.length); }
  function prev(){ if(photos.length === 0) return; setIndex(i => (i - 1 + photos.length) % photos.length); }
  function onTouchStart(e){ touchStartX.current = e.touches[0].clientX; }
  function onTouchMove(e){ if(!touchStartX.current) return; const diff = e.touches[0].clientX - touchStartX.current; if(Math.abs(diff) > 50){ if(diff < 0) next(); else prev(); touchStartX.current = null; } }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose}></div>

      <div className="relative w-full max-w-6xl bg-white rounded-xl md:rounded-2xl shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-12 max-h-[90vh] md:max-h-[95vh]">
        {/* Left: images */}
        <div className="md:col-span-5 bg-gray-100 p-3 md:p-4 flex flex-col">
          <div className="flex-1 rounded-lg overflow-hidden mb-3 md:mb-4 relative" onTouchStart={onTouchStart} onTouchMove={onTouchMove}>
            {photos.length > 0 ? (
              <>
                <img src={photos[index].url || photos[index].fileUrl || '/images/schoolphoto.png'} alt={current.title} className="w-full h-64 md:h-96 object-cover filter brightness-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/12 via-transparent to-black/6 pointer-events-none" />
                <button onClick={prev} className="absolute left-2 md:left-3 top-1/2 -translate-y-1/2 bg-white/90 rounded-full p-2 md:p-2 shadow text-sm md:text-base">‹</button>
                <button onClick={next} className="absolute right-2 md:right-3 top-1/2 -translate-y-1/2 bg-white/90 rounded-full p-2 md:p-2 shadow text-sm md:text-base">›</button>
              </>
            ) : (
              <div className="w-full h-64 md:h-96 bg-gray-200 flex items-center justify-center text-xs md:text-sm">No Image</div>
            )}

            {photos.length > 1 && (
              <div className="mt-2 md:mt-3 overflow-x-auto flex gap-2">
                {photos.map((p, i) => (
                  <button key={i} onClick={() => setIndex(i)} className={`flex-shrink-0 w-16 md:w-20 h-12 overflow-hidden rounded ${i===index? 'ring-2 ring-blue-500':'ring-0'}`}>
                    <img src={p.url || p.fileUrl} alt={p.caption || `thumb-${i}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: details */}
        <div className="md:col-span-7 p-4 md:p-6 flex flex-col">
          <div className="flex items-start justify-between gap-3 md:gap-4">
            <div className="flex-1 min-w-0">
              <h2 className="text-lg md:text-2xl font-bold text-gray-900 truncate">{current.title}</h2>
              <p className="text-gray-600 mt-1 text-xs md:text-sm">{current.location} • {current.eventDate ? new Date(current.eventDate).toLocaleString() : ''}</p>
            </div>
            <div>
              <button onClick={onClose} className="px-3 md:px-4 py-2 bg-gray-200 rounded text-xs md:text-sm">Close</button>
            </div>
          </div>

          <div className="mt-3 md:mt-4 overflow-auto" style={{ maxHeight: '40vh', maxHeight: '52vh' }}>
              <h3 className="text-base md:text-lg font-semibold text-gray-800 mb-2">Description</h3>
            {loading ? (
              <p className="text-gray-600 text-xs md:text-sm">Loading details…</p>
            ) : (
              <p className="text-gray-700 whitespace-pre-line leading-relaxed text-xs md:text-sm">{current.fullDescription || current.shortDescription}</p>
            )}

            {current.schedule && current.schedule.length > 0 && (
              <div className="mt-3 md:mt-4">
                <h4 className="font-semibold text-gray-800 text-sm md:text-base">Event Schedule</h4>
                <ul className="mt-2 space-y-2 text-gray-700 text-xs md:text-sm">
                  {current.schedule.map((s, idx) => (
                    <li key={idx} className="flex items-start gap-2 md:gap-3">
                      <div className="w-16 md:w-20 text-xs md:text-sm text-gray-600">{s.time}</div>
                      <div className="flex-1">{s.activity}</div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {current.additionalInfo && (
              <div className="mt-3 md:mt-4">
                <h4 className="font-semibold text-gray-800 text-sm md:text-base">Additional Information</h4>
                <p className="text-gray-700 mt-2 text-xs md:text-sm">{current.additionalInfo}</p>
              </div>
            )}
          </div>

          <div className="mt-3 md:mt-4 sticky bottom-0 bg-white py-2 md:py-3 flex justify-end gap-2 md:gap-3">
            <button className="px-4 md:px-6 py-2 bg-blue-600 text-white rounded font-semibold text-xs md:text-sm">Inquire</button>
            <button onClick={onClose} className="px-4 md:px-6 py-2 border rounded text-xs md:text-sm">Close</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventModal;
