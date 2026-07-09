const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const root = path.join(__dirname, '..');
const logoPath = path.join(root, 'public', 'logo.png');
const outPath = path.join(root, 'public', 'favicon.png');

async function run(){
  if(!fs.existsSync(logoPath)){
    console.error('Source logo not found at', logoPath);
    process.exit(2);
  }
  try{
    await sharp(logoPath)
      .resize(48,48, { fit: 'cover' })
      .png()
      .toFile(outPath);
    console.log('favicon.png created at', outPath);
  }catch(err){
    console.error('Failed to generate favicon:', err.message || err);
    process.exit(1);
  }
}

if(require.main === module) run();
