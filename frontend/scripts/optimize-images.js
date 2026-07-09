const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const scanDirs = [path.join(root, 'public', 'images'), path.join(root, 'src', 'assets')];

async function statFile(p) {
  try { const s = await fs.promises.stat(p); return s; } catch(e) { return null; }
}

async function findImages(dir){
  const results = [];
  try{
    const items = await fs.promises.readdir(dir, { withFileTypes: true });
    for(const it of items){
      const full = path.join(dir, it.name);
      if(it.isDirectory()){
        results.push(...await findImages(full));
      } else {
        if(/\.(jpe?g|png|gif|webp|avif)$/i.test(it.name)) results.push(full);
      }
    }
  }catch(e){ /* ignore missing */ }
  return results;
}

async function run(){
  const all = [];
  for(const d of scanDirs){
    const list = await findImages(d);
    all.push(...list);
  }

  if(all.length === 0){
    console.log('No images found in public/images or src/assets.');
    return;
  }

  console.log('Found', all.length, 'images. Generating report...');
  console.log('path,sizeKB,format,canConvertToWebPSuggestion');

  for(const f of all){
    const s = await statFile(f);
    const ext = path.extname(f).slice(1).toLowerCase();
    const sizeKB = s ? Math.round(s.size/1024) : -1;
    const suggestion = (ext === 'png' || ext === 'jpg' || ext === 'jpeg') ? 'convert-to-webp' : (ext === 'gif' ? 'consider-webm' : 'ok');
    console.log([path.relative(root, f).replace(/\\/g,'/'), sizeKB, ext, suggestion].join(','));
  }

  console.log('\nNotes:');
  console.log('- Install `sharp` to enable automatic conversion scripts: `npm install --save-dev sharp`');
  console.log('- Convert large JPEG/PNG images to WebP/AVIF and add responsive `srcset` and width/height attributes in markup.');
}

if(require.main === module) run().catch(err=>{ console.error(err); process.exit(1); });
