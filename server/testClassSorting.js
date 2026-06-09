#!/usr/bin/env node
/**
 * Test script to verify class sorting is working correctly
 * Run: node testClassSorting.js
 */

const mongoose = require('mongoose');
const ClassModel = require('./src/models/Class');
const classUtils = require('./src/utils/classUtils');

async function testClassSorting() {
  try {
    // Connect to database
    console.log('🔗 Connecting to database...\n');
    await mongoose.connect('mongodb+srv://balbodhschool:balbodhschool123@cluster0.mongodb.net/BalbodhDB', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('✓ Connected to database\n');
    
    // Fetch classes from database
    console.log('📚 Fetching classes from database...\n');
    const classes = await ClassModel.find({})
      .select('_id name')
      .lean();
    
    if (classes.length === 0) {
      console.error('❌ No classes found in database!');
      await mongoose.disconnect();
      return;
    }
    
    console.log(`✓ Found ${classes.length} classes in database:\n`);
    console.log('Classes BEFORE sorting:');
    classes.forEach((cls, i) => {
      const order = classUtils.getClassOrder(cls.name);
      const display = classUtils.formatClassName(cls.name);
      console.log(`  ${i}. "${cls.name}" → Display: "${display}", Order: ${order}`);
    });
    
    // Test sorting
    console.log('\n✓ Sorting classes...\n');
    const sorted = classUtils.sortClasses(classes);
    
    console.log('Classes AFTER sorting:');
    sorted.forEach((cls, i) => {
      const order = classUtils.getClassOrder(cls.name);
      const display = classUtils.formatClassName(cls.name);
      console.log(`  ${i}. "${cls.name}" → Display: "${display}", Order: ${order}`);
    });
    
    // Verify the order is correct
    console.log('\n✅ Expected order check:');
    const expectedOrder = ['Nursery', 'LKG', 'UKG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];
    const actualDisplayNames = sorted.map(c => classUtils.formatClassName(c.name));
    
    let allCorrect = true;
    for (let i = 0; i < actualDisplayNames.length; i++) {
      const actual = actualDisplayNames[i];
      const expected = expectedOrder[i];
      const status = actual === expected ? '✓' : '✗';
      console.log(`  ${status} Position ${i}: Expected "${expected}", Got "${actual}"`);
      if (actual !== expected) {
        allCorrect = false;
      }
    }
    
    // Final verdict
    console.log('\n' + (allCorrect ? '🎉 SUCCESS! All classes are in correct order!' : '⚠️ WARNING: Classes are not in expected order!'));
    
    // Show what the API would return
    console.log('\n📤 API Response format:');
    const apiResponse = sorted.map((cls, index) => ({
      _id: cls._id.toString().substring(0, 8) + '...',
      name: cls.name,
      displayName: classUtils.formatClassName(cls.name),
      order: classUtils.getClassOrder(cls.name),
      index: index
    }));
    
    console.log(JSON.stringify(apiResponse, null, 2));
    
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n✓ Database connection closed');
  }
}

// Run the test
testClassSorting();
