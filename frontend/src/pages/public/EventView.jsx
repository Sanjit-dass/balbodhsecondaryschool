import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import EventModal from '../../components/public/EventModal';

export default function EventView(){
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(()=>{
    let mounted = true;
    (async ()=>{
      try{
        setLoading(true);
        const res = await api.get(`/events-v2/${id}`);
        if(!mounted) return;
        const e = res.data || {};
        const photos = (e.photos || []).map(p => ({ url: p.url || p.fileUrl || p.path, publicId: p.publicId || p.public_id || null, caption: p.caption || '' })).filter(Boolean);
        const coverPhoto = e.coverPhoto ? ({ url: e.coverPhoto.url || e.coverPhoto.fileUrl || e.coverPhoto.path, publicId: e.coverPhoto.publicId || e.coverPhoto.public_id || null, caption: e.coverPhoto.caption || '' }) : (photos[0] || null);
        setEvent({ ...e, photos, coverPhoto });
      }catch(err){
        console.error('Failed to load event', err);
      }finally{ if(mounted) setLoading(false); }
    })();
    return ()=> { mounted = false; };
  },[id]);

  function handleClose(){
    // return to events list
    navigate('/events');
  }

  if(loading) return <div className="min-h-screen flex items-center justify-center">Loading…</div>;
  if(!event) return <div className="min-h-screen flex items-center justify-center">Event not found</div>;

  return (
    <EventModal event={event} onClose={handleClose} />
  );
}
