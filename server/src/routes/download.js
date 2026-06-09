const express = require('express');
const router = express.Router();
const https = require('https');
const http = require('http');

/**
 * Download endpoint to serve Cloudinary files with correct filenames.
 * Extracts filename from Cloudinary public_id or URL.
 * 
 * Usage: GET /api/download?url=<cloudinary_url>&filename=<optional_filename>
 */
router.get('/', async (req, res) => {
  try {
    const { url, filename } = req.query;
    
    if (!url) {
      return res.status(400).json({ message: 'URL parameter is required' });
    }
    
    // Validate it's a Cloudinary URL
    if (!url.includes('cloudinary.com')) {
      return res.status(400).json({ message: 'Only Cloudinary URLs are supported' });
    }

    // Extract filename from URL or use provided filename
    let downloadFilename = filename ? decodeURIComponent(filename) : extractFilenameFromCloudinary(url);
    
    // Ensure valid filename
    if (!downloadFilename || downloadFilename === 'false' || downloadFilename.trim() === '') {
      downloadFilename = 'download.pdf';
    }

    console.log('📥 Download request: filename=', downloadFilename, 'url=', url);

    // Fetch the file from Cloudinary
    await downloadFile(url, downloadFilename, res);
  } catch (err) {
    console.error('Download error:', err.message);
    if (!res.headersSent) {
      res.status(500).json({ message: 'Failed to download file' });
    }
  }
});

function downloadFile(fileUrl, filename, res) {
  return new Promise((resolve) => {
    const protocol = fileUrl.startsWith('https') ? https : http;
    
    const request = protocol.get(fileUrl, { timeout: 30000 }, (response) => {
      // Check for errors
      if (response.statusCode === 404) {
        if (!res.headersSent) {
          res.status(404).json({ message: 'File not found' });
        }
        resolve();
        return;
      }
      
      if (response.statusCode >= 400) {
        if (!res.headersSent) {
          res.status(response.statusCode).json({ message: 'Failed to retrieve file' });
        }
        resolve();
        return;
      }

      // Get content type
      let contentType = response.headers['content-type'] || 'application/octet-stream';
      
      // Ensure proper content type for PDFs
      if (filename.toLowerCase().endsWith('.pdf')) {
        contentType = 'application/pdf';
      } else if (filename.toLowerCase().endsWith('.doc')) {
        contentType = 'application/msword';
      } else if (filename.toLowerCase().endsWith('.docx')) {
        contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      }

      // Set headers for download
      res.set({
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${sanitizeFilename(filename)}"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Access-Control-Allow-Origin': '*',
      });

      // Pipe the response
      response.pipe(res);
      
      response.on('end', () => {
        resolve();
      });
    }).on('error', (err) => {
      console.error('HTTP request error:', err.message);
      if (!res.headersSent) {
        res.status(500).json({ message: 'Failed to retrieve file' });
      }
      resolve();
    });

    request.on('timeout', () => {
      request.destroy();
      if (!res.headersSent) {
        res.status(504).json({ message: 'Request timeout' });
      }
      resolve();
    });
  });
}

function extractFilenameFromCloudinary(url) {
  try {
    if (!url || typeof url !== 'string') {
      return 'download.pdf';
    }

    // Try URL object first
    try {
      const urlObj = new URL(url);
      let pathname = decodeURIComponent(urlObj.pathname);
      
      // Extract from pathname
      let filename = pathname.split('/').pop() || 'download';
      filename = filename.split('?')[0].split('#')[0];
      
      if (filename && filename !== '.' && filename.trim() !== '') {
        // Clean and return
        return filename.trim();
      }
    } catch (e) {
      // Continue to manual parsing
    }

    // Manual path extraction as fallback
    const match = url.match(/\/([^/?#]+)$/);
    if (match && match[1]) {
      let filename = decodeURIComponent(match[1]);
      if (filename && filename !== 'false') {
        return filename;
      }
    }

    // Last resort - try to get from Cloudinary public_id
    const publicIdMatch = url.match(/\/([a-zA-Z0-9_-]+)(?:\?|$)/);
    if (publicIdMatch && publicIdMatch[1]) {
      return publicIdMatch[1] + '.pdf';
    }

    return 'download.pdf';
  } catch (err) {
    console.error('Error extracting filename:', err.message);
    return 'download.pdf';
  }
}

function sanitizeFilename(filename) {
  if (!filename || typeof filename !== 'string') {
    return 'download.pdf';
  }

  // Remove invalid characters
  filename = filename.replace(/[<>:"|?*\x00-\x1f]/g, '_');
  
  // Remove leading/trailing spaces and dots
  filename = filename.trim().replace(/^\.+/, '');
  
  // Ensure max length
  if (filename.length > 255) {
    filename = filename.substring(0, 251) + '.pdf';
  }

  // Ensure it's not empty and not 'false'
  if (!filename || filename === 'false' || filename.trim() === '') {
    return 'download.pdf';
  }

  return filename;
}

module.exports = router;
