import React, { useState, useRef, useEffect, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';

export default function PDFViewer({ fileUrl, fileName }) {
  const { user } = useContext(AuthContext);

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pdfjsAvailable, setPdfjsAvailable] = useState(false);
  const [pdfDoc, setPdfDoc] = useState(null);
  const [numPages, setNumPages] = useState(0);
  const [page, setPage] = useState(1);
  const [scale, setScale] = useState(1.0);

  const canvasRef = useRef(null);

  if (!fileUrl) return null;

  const url = String(fileUrl).trim().toLowerCase();

  const isPDF =
    url.includes('.pdf') ||
    (fileName || '').toLowerCase().endsWith('.pdf');

  if (!isPDF) return null;

  const cloudinaryUrl = fileUrl; // KEEP ORIGINAL URL (IMPORTANT FIX)

  const isValidUrl =
    typeof cloudinaryUrl === 'string' &&
    cloudinaryUrl.startsWith('http');

  if (!isValidUrl) {
    return (
      <div className="text-red-600 text-sm mt-2">
        Invalid PDF URL
      </div>
    );
  }

  // ---------------- OPEN VIEWER ----------------
  const openViewer = async () => {
    setOpen(true);
    setLoading(true);

    try {
      const pdfjs = await import('pdfjs-dist/legacy/build/pdf');

      pdfjs.GlobalWorkerOptions.workerSrc =
        'https://unpkg.com/pdfjs-dist@2.16.105/build/pdf.worker.min.js';

      const loadingTask = pdfjs.getDocument({
        url: cloudinaryUrl,
        withCredentials: false,
      });

      const doc = await loadingTask.promise;

      setPdfjsAvailable(true);
      setPdfDoc(doc);
      setNumPages(doc.numPages);
      setPage(1);
      setScale(1.0);

      const firstPage = await doc.getPage(1);
      renderPage(firstPage, 1, 1.0);
    } catch (err) {
      console.warn('PDF.js failed, using iframe fallback', err);
      setPdfjsAvailable(false);
    } finally {
      setLoading(false);
    }
  };

  // ---------------- RENDER PAGE ----------------
  const renderPage = async (pageObj, _, scaleValue) => {
    try {
      const viewport = pageObj.getViewport({ scale: scaleValue });

      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      canvas.width = viewport.width;
      canvas.height = viewport.height;

      await pageObj.render({
        canvasContext: ctx,
        viewport,
      }).promise;
    } catch (err) {
      console.error('Render error:', err);
    }
  };

  // ---------------- PAGE NAV ----------------
  const goToPage = async (p) => {
    if (!pdfDoc) return;

    const clamped = Math.max(1, Math.min(numPages, Number(p) || 1));
    setPage(clamped);

    const pageObj = await pdfDoc.getPage(clamped);
    renderPage(pageObj, clamped, scale);
  };

  const changeScale = async (s) => {
    setScale(s);

    if (!pdfDoc) return;
    const pageObj = await pdfDoc.getPage(page);

    renderPage(pageObj, page, s);
  };

  // ---------------- DOWNLOAD ----------------
  const downloadFile = () => {
    const a = document.createElement('a');
    a.href = cloudinaryUrl;
    a.target = '_blank';
    a.download = fileName || 'document.pdf';
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  // ---------------- PRINT ----------------
  const printFile = () => {
    const w = window.open(cloudinaryUrl, '_blank');
    if (w) {
      w.onload = () => {
        w.focus();
        w.print();
      };
    }
  };

  const openInNewTab = () => {
    window.open(cloudinaryUrl, '_blank');
  };

  return (
    <div className="mt-2">

      {/* FILE ROW */}
      <div className="flex items-center gap-3">
        <div className="flex-1 text-sm text-gray-700">
          {fileName || cloudinaryUrl.split('/').pop()}
        </div>

        <button
          onClick={openInNewTab}
          className="px-3 py-1 bg-indigo-600 text-white rounded"
        >
          View PDF
        </button>

        {/* Download button removed from the file row — kept inside the viewer modal */}
      </div>

      {/* MODAL */}
      {open && (
        <div className="fixed inset-0 z-50 flex justify-center p-4">

          <div
            className="fixed inset-0 bg-black/40"
            onClick={() => setOpen(false)}
          />

          <div className="relative w-full max-w-6xl h-[90vh] bg-white flex flex-col rounded z-10">

            {/* HEADER */}
            <div className="flex justify-between p-3 border-b">
              <div>
                <div className="font-semibold">{fileName}</div>
                <div className="text-xs text-gray-500">
                  {numPages ? `${page} / ${numPages}` : ''}
                </div>
              </div>

              <div className="flex gap-2">
                <button onClick={printFile} className="border px-2 rounded">
                  Print
                </button>
                <button onClick={openInNewTab} className="border px-2 rounded">
                  Open
                </button>
                <button onClick={() => setOpen(false)} className="border px-2 rounded">
                  Close
                </button>
              </div>
            </div>

            {/* VIEWER */}
            <div className="flex-1 overflow-auto flex justify-center p-4">

              {loading && <div>Loading PDF...</div>}

              {!loading && pdfjsAvailable && (
                <canvas ref={canvasRef} className="max-w-full h-auto" />
              )}

              {!loading && !pdfjsAvailable && (
                <iframe
                  // hide the native toolbar so our modal controls are primary
                  src={`${cloudinaryUrl}#toolbar=0`}
                  className="w-full h-full border-0"
                  title="PDF"
                />
              )}
            </div>

            {/* CONTROLS */}
            <div className="p-2 border-t flex gap-2 items-center">

              <button onClick={() => goToPage(page - 1)}>Prev</button>

              <input
                value={page}
                onChange={(e) => goToPage(e.target.value)}
                className="w-16 border text-center"
              />

              <button onClick={() => goToPage(page + 1)}>Next</button>

              <input
                type="range"
                min="0.5"
                max="2"
                step="0.1"
                value={scale}
                onChange={(e) => changeScale(Number(e.target.value))}
              />
            </div>

          </div>
        </div>
      )}
    </div>
  );
}