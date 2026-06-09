const express = require('express');
const router = express.Router();
const https = require('https');
const http = require('http');
const { URL } = require('url');
const cloudinary = require('../utils/cloudinary');

const MAX_REDIRECTS = 5;

/**
 * Proxy endpoint to serve Cloudinary files with proper inline viewing headers.
 * Ensures PDFs and documents display inline instead of forcing downloads.
 * 
 * For public Cloudinary URLs, redirects directly to avoid authentication issues.
 * For restricted URLs, proxies through the server.
 * 
 * Usage: GET /api/fileview?url=<cloudinary_url>
 */
router.get('/', (req, res) => {
  try {
    const { url } = req.query;
    
    if (!url) {
      return res.status(400).json({ message: 'URL parameter is required' });
    }
    
    // Validate it's a Cloudinary URL
    if (!url.includes('cloudinary.com')) {
      return res.status(400).json({ message: 'Only Cloudinary URLs are supported' });
    }

    // For public Cloudinary URLs (secure_url/res.cloudinary.com) redirect the client
    // directly to the Cloudinary resource so browsers/iframes receive the raw file.
    if (url.includes('secure_url') || url.includes('res.cloudinary.com')) {
      console.log('📍 Redirecting client to public Cloudinary URL:', url.substring(0, 80) + '...');
      return res.redirect(302, url);
    }

    // For other resources, try to proxy
    let fileUrl = url;
    if (url.includes('/raw/upload/')) {
      if (!url.includes('fl_attachment')) {
        fileUrl = url.replace('/raw/upload/', '/raw/upload/fl_attachment:false/');
      }
    }

    fetchAndServeFileWithRedirects(fileUrl, url, res, 0);
  } catch (err) {
    console.error('File view error:', err.message);
    if (!res.headersSent) {
      res.status(500).json({ message: 'Failed to retrieve file' });
    }
  }
});

function fetchAndServeFileWithRedirects(fileUrl, originalUrl, res, redirectCount) {
  if (redirectCount > MAX_REDIRECTS) {
    console.error('Too many redirects while fetching file:', fileUrl);
    if (!res.headersSent) {
      res.status(502).json({ message: 'Too many redirects while fetching file' });
    }
    return;
  }

  const protocol = fileUrl.startsWith('https') ? https : http;
  
  const request = protocol.get(fileUrl, { timeout: 30000 }, (response) => {
    try {
      // Handle redirects
      if ([301, 302, 303, 307, 308].includes(response.statusCode)) {
        const location = response.headers.location;
        if (!location) {
          console.error('Redirect without location header:', fileUrl);
          if (!res.headersSent) {
            res.status(502).json({ message: 'Invalid redirect response' });
          }
          return;
        }

        try {
          const nextUrl = new URL(location, fileUrl).toString();
          return fetchAndServeFileWithRedirects(nextUrl, originalUrl, res, redirectCount + 1);
        } catch (urlErr) {
          console.error('Invalid redirect URL:', location, urlErr.message);
          if (!res.headersSent) {
            res.status(502).json({ message: 'Invalid redirect URL' });
          }
          return;
        }
      }

      // Handle error responses
      if (response.statusCode === 401) {
        console.error('❌ Cloudinary 401 Unauthorized - file may be deleted or access restricted');
        // Try to resolve via Cloudinary API using the public_id extracted from the URL
        const publicId = extractPublicIdFromUrl(originalUrl);
        if (publicId) {
          console.log('🔎 Attempting Cloudinary API lookup for public_id:', publicId);
          return cloudinary.api.resource(publicId, { resource_type: 'auto' }, (err, result) => {
            if (!err && result && (result.secure_url || result.url)) {
              if (!res.headersSent) {
                return res.status(200).json({ url: result.secure_url || result.url, note: 'resolved_via_cloudinary_api' });
              }
              return;
            }
            console.error('Cloudinary API lookup failed:', err && err.message);
            if (!res.headersSent) {
              return res.status(404).json({ message: 'File not found or access denied on Cloudinary' });
            }
            return;
          });
        }
        if (!res.headersSent) {
          res.status(404).json({ message: 'File not found or access denied on Cloudinary' });
        }
        return;
      }

      if (response.statusCode === 404) {
        if (!res.headersSent) {
          res.status(404).json({ message: 'File not found' });
        }
        return;
      }
      
      if (response.statusCode >= 400) {
        if (!res.headersSent) {
          res.status(response.statusCode).json({ message: `Cloudinary error: ${response.statusMessage}` });
        }
        return;
      }

      // Prepare headers for inline display
      const filename = getFilenameFromUrl(originalUrl);
      let contentType = response.headers['content-type'] || 'application/octet-stream';
      if (originalUrl.endsWith('.pdf') || originalUrl.includes('.pdf?') || originalUrl.includes('.pdf#')) {
        contentType = 'application/pdf';
      }

      res.set({
        'Content-Type': contentType,
        'Content-Disposition': `inline; filename="${filename}"`,
        'Cache-Control': 'public, max-age=86400',
        'Access-Control-Allow-Origin': '*',
      });

      // Stream the file
      response.pipe(res);
      
      response.on('error', (err) => {
        console.error('Response stream error:', err.message);
        if (!res.headersSent) {
          res.status(500).json({ message: 'Stream error' });
        }
      });
    } catch (err) {
      console.error('Error handling file response:', err.message);
      if (!res.headersSent) {
        res.status(500).json({ message: 'Failed to process file' });
      }
    }
  }).on('error', (err) => {
    console.error('HTTP request error:', err.message);
    if (!res.headersSent) {
      res.status(500).json({ message: 'Failed to retrieve file' });
    }
  });

  request.on('timeout', () => {
    request.destroy();
    if (!res.headersSent) {
      res.status(504).json({ message: 'Request timeout' });
    }
  });

  request.on('abort', () => {
    if (!res.headersSent) {
      res.status(500).json({ message: 'Request aborted' });
    }
  });
}

function getFilenameFromUrl(url) {
  try {
    if (!url || typeof url !== 'string') {
      return 'file.pdf';
    }

    // Try to extract from URL
    const urlObj = new URL(url);
    let pathname = decodeURIComponent(urlObj.pathname);
    
    // Get filename from path
    let filename = pathname.split('/').pop() || 'file';
    
    // Remove query parameters
    filename = filename.split('?')[0].split('#')[0];
    
    // Ensure filename has an extension
    if (!filename || filename === '.' || filename.trim() === '') {
      return 'file.pdf';
    }
    
    // Clean filename
    filename = filename.trim();
    if (filename.length > 255) {
      filename = filename.substring(0, 255);
    }
    
    console.log('✅ Extracted filename:', filename);
    return filename;
  } catch (err) {
    console.error('Error extracting filename:', err.message);
    return 'file.pdf';
  }
}

function extractPublicIdFromUrl(url) {
  try {
    if (!url || typeof url !== 'string') return null;
    const u = new URL(url);
    const parts = u.pathname.split('/');
    const uploadIndex = parts.findIndex(p => p === 'upload');
    if (uploadIndex === -1) return null;
    let publicParts = parts.slice(uploadIndex + 1);
    // Remove version segment if present (e.g., v123456)
    if (publicParts.length && /^v\d+$/.test(publicParts[0])) publicParts.shift();
    if (!publicParts.length) return null;
    // Remove file extension from last part
    const last = publicParts.pop().replace(/\.[^/.]+$/, '');
    publicParts.push(last);
    // Join remaining path as public_id
    const publicId = publicParts.join('/');
    return publicId || null;
  } catch (err) {
    console.error('Error extracting public_id from URL:', err && err.message);
    return null;
  }
}

module.exports = router;
