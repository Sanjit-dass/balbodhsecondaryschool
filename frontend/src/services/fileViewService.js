/**
 * Get the URL for viewing a file inline.
 * For Cloudinary URLs, add fl_attachment:false to force inline display.
 */
export const getInlineViewUrl = (fileUrl) => {
  if (!fileUrl || typeof fileUrl !== 'string') return fileUrl;
  
  const trimmed = fileUrl.trim();
  
  // If it's a Cloudinary URL, add inline display transformation for non-PDF resources.
  // Some Cloudinary-served PDFs can fail when `fl_attachment:false` is forced, so leave PDF URLs untouched.
  if (trimmed.includes('cloudinary.com') && trimmed.includes('/upload/')) {
    const lower = trimmed.toLowerCase();
   const isPdf =
  lower.endsWith('.pdf') ||
  lower.includes('.pdf?') ||
  lower.includes('.pdf#') ||
  lower.includes('/pdf/');
    if (isPdf) {
      // Do not rewrite Cloudinary PDF URLs here — let server-side resolution
      // or Cloudinary's own URL serve the correct resource type. Returning
      // the original secure URL avoids introducing incorrect `/raw/upload/`
      // paths that can 404 if the asset isn't stored as raw.
      return trimmed;
    }
    if (trimmed.includes('fl_attachment:false')) {
      return trimmed;
    }
    return trimmed.replace(/\/upload\/(?!fl_attachment:false)(.*)/, '/upload/fl_attachment:false/$1');
  }
  
  return trimmed;
};

/**
 * Extract filename from Cloudinary URL or use suggested filename
 */
export const extractFilenameFromUrl = (url, suggestedName = null) => {
  if (suggestedName) return suggestedName;
  try {
    if (!url || typeof url !== 'string') return 'file.pdf';
    const pathParts = url.split('/');
    let filename = pathParts[pathParts.length - 1];
    filename = filename.split('?')[0].split('#')[0];
    return decodeURIComponent(filename) || 'file.pdf';
  } catch (err) {
    return 'file.pdf';
  }
};

export default { getInlineViewUrl, extractFilenameFromUrl };
