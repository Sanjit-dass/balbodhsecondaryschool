/*
Migration script to classify existing documents and photos into categories.
Run with: node server/scripts/migrate_classify_documents.js
Requires environment where server can connect to DB (uses ../src/config/db.js)
*/
const path = require('path');
const mongoose = require('mongoose');
const db = require('../src/config/db');
const Document = require('../src/models/Document');
const PhotoGallery = require('../src/models/PhotoGallery');

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGODB_URL;
const FALLBACK = process.env.MONGODB_DIRECT_URI || null;

(async function() {
  try {
    if (!MONGO_URI) throw new Error('MONGODB_URI not set in environment');
    await db.connectDB(MONGO_URI, FALLBACK);

    console.log('Connected. Starting classification migration...');

    // Documents: ensure category is set to important-document for office docs
    const docs = await Document.find({});
    for (const d of docs) {
      const ext = (d.originalName || '').split('.').pop().toLowerCase();
      const mime = (d.mimetype || '').toLowerCase();
      if (['pdf','doc','docx'].includes(ext) || mime.includes('pdf') || mime.includes('word')) {
        if (d.category !== 'important-document') {
          console.log(`Updating Document ${d._id} -> important-document`);
          d.category = 'important-document';
          await d.save();
        }
      } else if (mime.startsWith('image/') || ['jpg','jpeg','png','gif','webp'].includes(ext)) {
        // images in Document collection are likely miscategorized; move metadata to PhotoGallery
        console.log(`Image found in Documents: ${d._id} originalName=${d.originalName} -> converting to PhotoGallery.photo`);
        // create a new PhotoGallery to host this photo under student-gallery by default
        const pg = new PhotoGallery({ title: d.title || 'Imported Images', description: d.description || '', category: 'student-gallery', photos: [{ title: d.originalName, url: d.fileUrl, publicId: d.publicId, category: 'student-gallery' }], status: d.status || 'published', createdBy: d.createdBy });
        await pg.save();
        await Document.findByIdAndDelete(d._id);
        console.log(`Moved document ${d._id} -> PhotoGallery ${pg._id}`);
      } else {
        // other files: leave as important-document
        if (!d.category) { d.category = 'important-document'; await d.save(); console.log(`Set category for ${d._id} to important-document`); }
      }
    }

    // PhotoGallery: ensure each photo has category set and galleries not 'important-document'
    const galleries = await PhotoGallery.find({});
    for (const g of galleries) {
      // if gallery category accidentally set to document, fix to class-gallery
      if (!g.category || g.category === 'important-document') {
        console.log(`Fixing gallery ${g._id} category from '${g.category}' -> 'class-gallery'`);
        g.category = 'class-gallery';
      }
      let changed = false;
      for (const p of g.photos) {
        if (!p.category || p.category === 'important-document') {
          p.category = g.category || 'class-gallery';
          changed = true;
        }
      }
      if (changed) await g.save();
    }

    console.log('Migration complete.');
    await db.disconnectDB();
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    try { await db.disconnectDB(); } catch(e){}
    process.exit(1);
  }
})();
