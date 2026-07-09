const sharp = require('sharp');
const pngToIcoRaw = require('png-to-ico');
const pngToIco = pngToIcoRaw.default || pngToIcoRaw;
const path = require('path');
const fs = require('fs');

const root = path.join(__dirname, '..');
const logoPath = path.join(root, 'public', 'logo.png');
const outPng = path.join(root, 'public', 'favicon.png');
const outIco = path.join(root, 'public', 'favicon.ico');
const out192 = path.join(root, 'public', 'favicon-192.png');
const out512 = path.join(root, 'public', 'favicon-512.png');

async function run(){
  if(!fs.existsSync(logoPath)){
    console.error('Source logo not found at', logoPath);
    process.exit(2);
  }
  try{
    // create 48x48 PNG
    await sharp(logoPath)
      .resize(48,48, { fit: 'cover' })
      .png()
      .toFile(outPng);

    // create 192x192 and 512x512 PNGs for Android/large icons
    await sharp(logoPath).resize(192,192, { fit: 'cover' }).png().toFile(out192);
    await sharp(logoPath).resize(512,512, { fit: 'cover' }).png().toFile(out512);

    // create ICO (contains 48x48)
    const icoBuffer = await pngToIco([outPng]);
    await fs.promises.writeFile(outIco, icoBuffer);

    console.log('favicon.png created at', outPng);
    console.log('favicon.ico created at', outIco);
  }catch(err){
    console.error('Failed to generate favicon:', err.message || err);
    process.exit(1);
  }
}

if(require.main === module) run();
