const express = require('express');
const router = express.Router();
const https = require('https');
const http = require('http');
const { URL } = require('url');

const MAX_REDIRECTS = 5;

/**
 * PDF viewing endpoint that streams Cloudinary PDFs with proper inline headers.
 * This solves Cloudinary's default behavior of serving raw files with download headers.
 * 
 * Usage: GET /api/pdf?url=<cloudinary_url>
 */
router.get('/', (req, res) => {
  try {
    const { url } = req.query;

    if (!url) {
      return res.status(400).json({ message: 'URL parameter is required' });
    }

    // Only allow Cloudinary URLs for security
    if (!url.includes('res.cloudinary.com')) {
      return res.status(400).json({ message: 'Only Cloudinary URLs are supported' });
    }

    console.log('📄 Serving PDF from Cloudinary:', url);
    fetchPdfWithRedirects(url, res, 0);

  } catch (err) {
    console.error('PDF serving error:', err.message);
    if (!res.headersSent) {
      res.status(500).json({ message: 'Failed to serve PDF' });
    }
  }
});

function fetchPdfWithRedirects(requestUrl, res, redirectCount) {
  if (redirectCount > MAX_REDIRECTS) {
    console.error('Too many redirects while fetching PDF:', requestUrl);
    if (!res.headersSent) {
      res.status(502).json({ message: 'Too many redirects while fetching PDF' });
    }
    return;
  }

  const protocol = requestUrl.startsWith('https') ? https : http;

  const request = protocol.get(requestUrl, { timeout: 30000 }, (response) => {
    try {
      if ([301, 302, 303, 307, 308].includes(response.statusCode)) {
        const location = response.headers.location;
        if (!location) {
          console.error('Redirect without location header:', requestUrl);
          if (!res.headersSent) {
            res.status(502).json({ message: 'Invalid redirect response from Cloudinary' });
          }
          return;
        }

        try {
          const nextUrl = new URL(location, requestUrl).toString();
          return fetchPdfWithRedirects(nextUrl, res, redirectCount + 1);
        } catch (urlErr) {
          console.error('Invalid redirect URL:', location, urlErr.message);
          if (!res.headersSent) {
            res.status(502).json({ message: 'Invalid redirect URL' });
          }
          return;
        }
      }

      if (response.statusCode !== 200) {
        console.error(`Cloudinary returned ${response.statusCode}:`, response.statusMessage);
        if (!res.headersSent) {
          res.status(response.statusCode).json({ message: `Cloudinary error: ${response.statusMessage}` });
        }
        return;
      }

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'inline; filename="document.pdf"');
      res.setHeader('Cache-Control', 'public, max-age=31536000');
      res.setHeader('Access-Control-Allow-Origin', '*');

      response.pipe(res);

      response.on('error', (err) => {
        console.error('Cloudinary stream error:', err.message);
        if (!res.headersSent) {
          res.status(500).json({ message: 'Failed to stream PDF' });
        }
      });
    } catch (err) {
      console.error('Error handling PDF response:', err.message);
      if (!res.headersSent) {
        res.status(500).json({ message: 'Failed to process PDF' });
      }
    }
  }).on('error', (err) => {
    console.error('HTTP request error:', err.message);
    if (!res.headersSent) {
      res.status(500).json({ message: 'Failed to fetch PDF from Cloudinary' });
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

module.exports = router;
