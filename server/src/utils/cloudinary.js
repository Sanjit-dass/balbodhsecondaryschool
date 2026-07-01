const cloudinary = require('cloudinary').v2;

// Prefer passing the full CLOUDINARY_URL if provided. The library accepts a
// connection string or an object of credentials. Ensure `secure: true` is set
// so returned URLs use HTTPS.
try {
  if (process.env.CLOUDINARY_URL) {
    // Validate that CLOUDINARY_URL is not using placeholder values
    const cloudinaryUrl = process.env.CLOUDINARY_URL;
    if (cloudinaryUrl.includes('<your_api_key>') || cloudinaryUrl.includes('<your_api_secret>') || cloudinaryUrl.includes('<cloud_name>')) {
      console.error('❌ Cloudinary URL contains placeholder values. Please configure real credentials in .env');
    } else {
      // cloudinary.config accepts a single string argument (the URL)
      cloudinary.config(cloudinaryUrl);
      cloudinary.config({ secure: true });
      console.log('✅ Cloudinary configured successfully');
    }
  } else {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
      secure: true,
    });
    console.log('✅ Cloudinary configured with individual credentials');
  }
} catch (err) {
  // Log configuration errors but don't throw here — callers will surface problems
  // when trying to use Cloudinary.
  console.error('❌ Cloudinary configuration failed:', err && err.message);
}

module.exports = cloudinary;
