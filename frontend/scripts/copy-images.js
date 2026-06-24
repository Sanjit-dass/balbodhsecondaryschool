const fs = require('fs');
const path = require('path');

async function copyImages() {
  const repoRoot = path.join(__dirname, '..');
  const src = path.join(repoRoot, 'src', 'images');
  const dest = path.join(repoRoot, 'public', 'images');

  try {
    if (!fs.existsSync(src)) {
      console.warn('[copy-images] source folder does not exist:', src);
      return;
    }

    await fs.promises.mkdir(dest, { recursive: true });
    // recursive copy
    await fs.promises.cp(src, dest, { recursive: true, force: true });
    console.log('[copy-images] copied images from', src, 'to', dest);
  } catch (err) {
    console.error('[copy-images] failed to copy images:', err);
    process.exitCode = 1;
  }
}

copyImages();
