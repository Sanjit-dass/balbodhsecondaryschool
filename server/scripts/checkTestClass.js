require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { connectDB, disconnectDB } = require('../src/config/db');
const ClassModel = require('../src/models/Class');
const MONGO_URI = process.env.MONGODB_URL || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/balbodh';

async function check() {
  await connectDB(MONGO_URI);
  try {
    const name = 'Test Class ERP';
    const cls = await ClassModel.findOne({ name });
    if (!cls) console.log('NOT FOUND');
    else console.log('FOUND', cls._id.toString());
  } catch (err) {
    console.error('ERR', err);
  } finally {
    await disconnectDB();
  }
}
check().catch(e=>{console.error(e);process.exit(1)});
