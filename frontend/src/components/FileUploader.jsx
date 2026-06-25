import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';

export default function FileUploader({ folder = 'others', accept = 'image/*,application/pdf,.doc,.docx', onUploaded, persistDocument = false }){
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const fileInputRef = useRef(null);

  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

  useEffect(()=>{
    if(file && file.type.startsWith('image/')){
      const url = URL.createObjectURL(file);
      setPreview(url);
      return ()=> URL.revokeObjectURL(url);
    }
    setPreview('');
  },[file]);

  const handleFileSelect = (selectedFile) => {
    setError('');
    setSuccess('');
    
    if (!selectedFile) {
      setFile(null);
      return;
    }

    // File size validation
    if (selectedFile.size > MAX_FILE_SIZE) {
      setError(`File size exceeds 5MB limit. Selected: ${(selectedFile.size / 1024 / 1024).toFixed(2)}MB`);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // File type validation for image uploads
    if (accept.includes('image') && !selectedFile.type.startsWith('image/')) {
      setError('Please select an image file (JPG, PNG)');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setFile(selectedFile);
  };

  const upload = async (attempt = 1) => {
    if(!file) return;
    setLoading(true);
    setError('');
    setProgress(0);

    const fd = new FormData();
    fd.append('file', file);

    try{
      // By default use the lightweight upload endpoint that only stores the file in Cloudinary
      // and returns fileUrl/publicId. Set persistDocument=true to create a Document DB record (/uploads).
      const endpoint = persistDocument ? `/uploads?folder=${encodeURIComponent(folder)}` : `/upload?folder=${encodeURIComponent(folder)}`;
      const res = await api.post(endpoint, fd, {
        onUploadProgress: (e) => {
          if (e.total) {
            setProgress(Math.round((e.loaded / e.total) * 100));
          }
        }
      });
      setLoading(false);
      setFile(null);
      setProgress(100);
      setSuccess('✓ Upload successful!');

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      // Pass the response data with original filename
      const uploadedData = {
        ...res.data,
        originalName: res.data.originalName || file.name,
        fileName: file.name
      };
      onUploaded && onUploaded(uploadedData);
      
      // Reset success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    }catch(err){
      const status = err?.response?.status;
      const msg = err?.response?.data?.message || err?.message || 'Upload failed';
      if(status === 429 && attempt < 3){
        const delay = 500 * attempt;
        await new Promise((resolve) => setTimeout(resolve, delay));
        return upload(attempt + 1);
      }
      setLoading(false);
      setProgress(0);
      const displayMessage = status === 429 ? 'Upload rate limit reached. Please wait a few seconds and retry.' : msg;
      setError(displayMessage);
      console.error('Upload error', err);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          accept={accept}
          type="file"
          onChange={(e) => handleFileSelect(e.target.files?.[0])}
          className="hidden"
        />
        
        {/* Custom file picker button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="px-4 py-2 bg-slate-200 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-300 transition whitespace-nowrap border border-slate-300"
        >
          📁 Choose Photo
        </button>

        {/* Upload button */}
        <button 
          type="button" 
          disabled={!file || loading} 
          onClick={() => upload()} 
          className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition whitespace-nowrap"
        >
          {loading ? `${progress}%` : '⬆️ Upload'}
        </button>
      </div>

      {file && (
        <div className="flex items-center gap-2 text-sm text-slate-700 bg-slate-50 p-2 rounded-lg">
          📄 {file.name}
          <span className="text-xs text-slate-500">({(file.size / 1024).toFixed(1)}KB)</span>
        </div>
      )}

      {error && (
        <div className="text-sm text-red-600 bg-red-50 p-2 rounded-lg">
          ❌ {error}
        </div>
      )}

      {success && (
        <div className="text-sm text-emerald-600 bg-emerald-50 p-2 rounded-lg">
          {success}
        </div>
      )}

      {loading && (
        <div className="w-full bg-slate-100 rounded h-1.5">
          <div 
            style={{width: `${progress}%`}} 
            className="h-1.5 bg-indigo-600 rounded transition-all"
          />
        </div>
      )}

      {file && !file.type.startsWith('image/') && !error && (
        <div className="text-sm text-amber-600 bg-amber-50 p-2 rounded-lg">
          ⚠️ Image preview may not be available for non-image files.
        </div>
      )}

      {preview && (
        <div className="flex flex-col gap-2">
          <img src={preview} alt="preview" className="w-full h-32 object-cover rounded-lg border border-slate-200" />
          <div className="text-xs text-slate-500 text-center">Preview - Click Upload above to upload</div>
        </div>
      )}
    </div>
  );
}
