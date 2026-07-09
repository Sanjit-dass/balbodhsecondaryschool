const sharp = require('sharp');
const pngToIcoRaw = require('png-to-ico');
const pngToIco = pngToIcoRaw.default || pngToIcoRaw;
const path = require('path');
const fs = require('fs');

const root = path.join(__dirname, '..');
const logoPath = path.join(root, 'public', 'logo.png');
const outPng = path.join(root, 'public', 'favicon.png');
const outIco = path.join(root, 'public', 'favicon.ico');

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
