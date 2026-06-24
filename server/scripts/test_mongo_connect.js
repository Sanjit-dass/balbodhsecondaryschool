const mongoose = require('mongoose');
require('dotenv').config({ path: __dirname + '/../.env' });

const uri = process.env.MONGODB_URL;
console.log('Testing MongoDB URI:', uri ? 'loaded' : 'MONGODB_URL not set');

(async () => {
  try {
    await mongoose.connect(uri, { dbName: 'balbodh_school' });
    console.log('✅ Mongoose connected successfully');
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('❌ Mongoose connection error:');
    console.error(err);
    process.exit(2);
  }
})();
