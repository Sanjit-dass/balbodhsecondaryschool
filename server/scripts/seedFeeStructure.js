require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../src/config/db');
const ClassModel = require('../src/models/Class');
const FeeCategory = require('../src/models/FeeCategory');
const FeeStructure = require('../src/models/FeeStructure');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/balbodh';

async function seed() {
  await connectDB(MONGO_URI);

  // ensure class exists
  let cls = await ClassModel.findOne({ name: /Nursery/i });
  if (!cls) {
    cls = new ClassModel({ name: 'Nursery', numeric: null, sections: [] });
    await cls.save();
    console.log('Created class Nursery with id', cls._id);
  } else {
    console.log('Found class Nursery with id', cls._id);
  }

  // categories to ensure
  const categories = [
    { name: 'Admission fee' },
    { name: 'Monthly fee' },
    { name: 'Transporation fee' },
    { name: 'Tution fee' }
  ];

  for (const cat of categories) {
    const exists = await FeeCategory.findOne({ name: cat.name });
    if (!exists) {
      await new FeeCategory(cat).save();
      console.log('Inserted category', cat.name);
    } else {
      console.log('Category exists', cat.name);
    }
  }

  // Remove existing structure for Nursery to avoid duplicates
  await FeeStructure.deleteMany({ classId: cls._id });

  // Create structure items
  const items = [
    { category: 'Admission fee', amount: 500 },
    { category: 'Monthly fee', amount: 500 },
    { category: 'Transporation fee', amount: 500 },
    { category: 'Tution fee', amount: 5000 }
  ];

  const docs = items.map(it => ({ classId: cls._id, category: it.category, amount: it.amount }));
  await FeeStructure.insertMany(docs);
  console.log('Inserted fee structure for Nursery. Total:', docs.reduce((s,d)=>s+d.amount,0));

  mongoose.connection.close();
  console.log('Done.');
}

seed().catch(err => { console.error(err); mongoose.connection.close(); process.exit(1); });