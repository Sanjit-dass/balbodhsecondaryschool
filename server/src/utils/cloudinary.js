const cloudinary = require('cloudinary').v2;

// Prefer passing the full CLOUDINARY_URL if provided. The library accepts a
// connection string or an object of credentials. Ensure `secure: true` is set
// so returned URLs use HTTPS.
try {
  if (process.env.CLOUDINARY_URL) {
    // cloudinary.config accepts a single string argument (the URL)
    cloudinary.config(process.env.CLOUDINARY_URL);
    cloudinary.config({ secure: true });
  } else {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
      secure: true,
    });
  }
} catch (err) {
  // Log configuration errors but don't throw here — callers will surface problems
  // when trying to use Cloudinary.
  // eslint-disable-next-line no-console
  console.error('Cloudinary configuration failed:', err && err.message);
}

module.exports = cloudinary;
