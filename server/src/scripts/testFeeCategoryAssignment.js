/**
 * FEE CATEGORY ASSIGNMENT - API TESTING GUIDE
 * 
 * New endpoints for assigning fee categories to classes with proper class ordering
 * Classes are sorted: Nursery, LKG, UKG, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10
 * 
 * Features:
 * - Mandatory items: Applied automatically to all students
 * - Optional items: Can be selected per student
 */

const BASE_URL = 'http://localhost:5000/api/fees';
const TOKEN = 'YOUR_AUTH_TOKEN_HERE';

// ============================================================================
// ENDPOINT 1: Get Classes in Proper Sorted Order
// ============================================================================
// Purpose: Fetch all classes sorted as Nursery, LKG, UKG, 1, 2, 3, ..., 10
// Used for: Populating class dropdown with correct ordering

async function getClassesForDropdown() {
  try {
    const response = await fetch(`${BASE_URL}/classes-dropdown`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    console.log('Classes in proper order:');
    console.log(data);
    
    return data.data;
  } catch (err) {
    console.error('Error fetching classes:', err);
  }
}

// CURL Example
// curl -X GET http://localhost:5000/api/fees/classes-dropdown \
//   -H "Authorization: Bearer YOUR_TOKEN" \
//   -H "Content-Type: application/json"

// Expected Response:
// {
//   "success": true,
//   "count": 13,
//   "data": [
//     {
//       "_id": "60d5ec49c1234567890abcd1",
//       "name": "Nursery",
//       "displayName": "Nursery",
//       "order": 0,
//       "index": 0
//     },
//     {
//       "_id": "60d5ec49c1234567890abcd2",
//       "name": "LKG",
//       "displayName": "LKG",
//       "order": 1,
//       "index": 1
//     },
//     ... (UKG at order 2, then 1-10 at orders 3-12)
//   ]
// }

// ============================================================================
// ENDPOINT 2: Get Current Fee Structure for a Class
// ============================================================================
// Purpose: Fetch current fee structure with separated mandatory and optional items
// Used for: Displaying existing fees and allowing user to update them

async function getClassFeeStructure(classId) {
  try {
    const response = await fetch(`${BASE_URL}/class/${classId}/fee-structure`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    console.log('Fee structure for class:');
    console.log(data);
    
    return data;
  } catch (err) {
    console.error('Error fetching fee structure:', err);
  }
}

// CURL Example
// curl -X GET http://localhost:5000/api/fees/class/60d5ec49c1234567890abcd1/fee-structure \
//   -H "Authorization: Bearer YOUR_TOKEN" \
//   -H "Content-Type: application/json"

// Expected Response:
// {
//   "success": true,
//   "classId": "60d5ec49c1234567890abcd1",
//   "data": {
//     "mandatory": {
//       "items": [
//         {
//           "_id": "60d5ec49c1234567890abcd3",
//           "classId": "60d5ec49c1234567890abcd1",
//           "name": "Tuition Fee",
//           "amount": 5000,
//           "description": "Monthly tuition",
//           "categoryType": "Mandatory Fee",
//           "status": "active"
//         },
//         {
//           "_id": "60d5ec49c1234567890abcd4",
//           "classId": "60d5ec49c1234567890abcd1",
//           "name": "Lab Fee",
//           "amount": 500,
//           "description": "Science lab usage",
//           "categoryType": "Mandatory Fee",
//           "status": "active"
//         }
//       ],
//       "total": 5500,
//       "count": 2,
//       "description": "Applied automatically to all students"
//     },
//     "optional": {
//       "items": [
//         {
//           "_id": "60d5ec49c1234567890abcd5",
//           "classId": "60d5ec49c1234567890abcd1",
//           "name": "Bus Service",
//           "amount": 1500,
//           "description": "Monthly transport",
//           "categoryType": "Optional Service",
//           "status": "active"
//         },
//         {
//           "_id": "60d5ec49c1234567890abcd6",
//           "classId": "60d5ec49c1234567890abcd1",
//           "name": "Hostel Facility",
//           "amount": 3000,
//           "description": "Residential facility",
//           "categoryType": "Optional Service",
//           "status": "active"
//         }
//       ],
//       "total": 4500,
//       "count": 2,
//       "description": "Can be selected by individual students"
//     },
//     "summary": {
//       "totalMandatory": 5500,
//       "totalOptional": 4500,
//       "grandTotal": 10000,
//       "totalCategories": 4
//     }
//   }
// }

// ============================================================================
// ENDPOINT 3: Assign Fee Categories to a Class
// ============================================================================
// Purpose: Create or update fee categories for a class
// Separates mandatory items (applied to all) and optional items (per-student)
// Used for: Adding/updating fees for a class

async function assignFeeCategoriesToClass(classId, categoriesData) {
  try {
    const response = await fetch(`${BASE_URL}/class/${classId}/assign-categories`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(categoriesData)
    });

    const data = await response.json();
    console.log('Assignment result:');
    console.log(data);
    
    return data;
  } catch (err) {
    console.error('Error assigning categories:', err);
  }
}

// CURL Example - Basic Usage
// curl -X POST http://localhost:5000/api/fees/class/60d5ec49c1234567890abcd1/assign-categories \
//   -H "Authorization: Bearer YOUR_TOKEN" \
//   -H "Content-Type: application/json" \
//   -d '{
//     "mandatory": [
//       {
//         "name": "Tuition Fee",
//         "amount": 5000,
//         "description": "Monthly tuition charges"
//       },
//       {
//         "name": "Lab Fee",
//         "amount": 500,
//         "description": "Science laboratory usage"
//       }
//     ],
//     "optional": [
//       {
//         "name": "Bus Service",
//         "amount": 1500,
//         "description": "Daily transportation"
//       },
//       {
//         "name": "Hostel Facility",
//         "amount": 3000,
//         "description": "Residential accommodation"
//       }
//     ]
//   }'

// JavaScript Example Usage
async function setupFeesForClass1() {
  const classId = '60d5ec49c1234567890abcd1'; // Class 1
  
  const feesData = {
    mandatory: [
      {
        name: 'Tuition Fee',
        amount: 5000,
        description: 'Monthly tuition charges'
      },
      {
        name: 'Lab Fee',
        amount: 500,
        description: 'Science laboratory usage'
      },
      {
        name: 'Sports Fee',
        amount: 300,
        description: 'Sports and games facility'
      }
    ],
    optional: [
      {
        name: 'Bus Service',
        amount: 1500,
        description: 'Daily transportation service'
      },
      {
        name: 'Hostel Facility',
        amount: 3000,
        description: 'Residential accommodation'
      },
      {
        name: 'Extra Coaching',
        amount: 2000,
        description: 'Optional coaching classes'
      }
    ]
  };
  
  return await assignFeeCategoriesToClass(classId, feesData);
}

// Expected Response:
// {
//   "success": true,
//   "message": "Successfully assigned 5 new and updated 0 categories",
//   "data": {
//     "created": [
//       {
//         "name": "Tuition Fee",
//         "type": "mandatory",
//         "_id": "60d5ec49c1234567890abcd7",
//         "amount": 5000
//       },
//       {
//         "name": "Lab Fee",
//         "type": "mandatory",
//         "_id": "60d5ec49c1234567890abcd8",
//         "amount": 500
//       },
//       {
//         "name": "Sports Fee",
//         "type": "mandatory",
//         "_id": "60d5ec49c1234567890abcd9",
//         "amount": 300
//       },
//       {
//         "name": "Bus Service",
//         "type": "optional",
//         "_id": "60d5ec49c1234567890abcda",
//         "amount": 1500
//       },
//       {
//         "name": "Hostel Facility",
//         "type": "optional",
//         "_id": "60d5ec49c1234567890abcdb",
//         "amount": 3000
//       }
//     ],
//     "updated": [],
//     "errors": []
//   }
// }

// ============================================================================
// WORKFLOW: Complete Fee Setup for a Class
// ============================================================================

async function completeFeeCategoryWorkflow() {
  console.log('\n=== STEP 1: Get all classes ===');
  const classes = await getClassesForDropdown();
  
  if (!classes || classes.length === 0) {
    console.log('No classes found');
    return;
  }
  
  // Select Nursery class
  const nurseryClass = classes.find(c => c.displayName === 'Nursery');
  if (!nurseryClass) {
    console.log('Nursery class not found');
    return;
  }
  
  console.log(`\nSelected class: ${nurseryClass.displayName}`);
  
  console.log('\n=== STEP 2: Check current fee structure ===');
  const currentStructure = await getClassFeeStructure(nurseryClass._id);
  console.log(`Current mandatory items: ${currentStructure.data.mandatory.count}`);
  console.log(`Current optional items: ${currentStructure.data.optional.count}`);
  
  console.log('\n=== STEP 3: Assign/Update fee categories ===');
  const assignResult = await assignFeeCategoriesToClass(nurseryClass._id, {
    mandatory: [
      {
        name: 'Tuition Fee',
        amount: 3500,
        description: 'Monthly tuition for Nursery'
      },
      {
        name: 'Activity Fee',
        amount: 300,
        description: 'Classroom activities and materials'
      }
    ],
    optional: [
      {
        name: 'Bus Service',
        amount: 1200,
        description: 'Daily transportation'
      },
      {
        name: 'Extra Activities',
        amount: 500,
        description: 'Art, music, dance classes'
      }
    ]
  });
  
  console.log(`\nCreated: ${assignResult.data.created.length} new categories`);
  console.log(`Updated: ${assignResult.data.updated.length} existing categories`);
  
  console.log('\n=== STEP 4: Verify updated structure ===');
  const updatedStructure = await getClassFeeStructure(nurseryClass._id);
  console.log(`Total mandatory amount: ₹${updatedStructure.data.summary.totalMandatory}`);
  console.log(`Total optional amount: ₹${updatedStructure.data.summary.totalOptional}`);
  console.log(`Grand total: ₹${updatedStructure.data.summary.grandTotal}`);
}

// ============================================================================
// SETUP EXAMPLE: Initialize all classes with standard fees
// ============================================================================

const standardFeeStructure = {
  Nursery: {
    mandatory: [
      { name: 'Tuition Fee', amount: 3500 },
      { name: 'Activity Fee', amount: 300 }
    ],
    optional: [
      { name: 'Bus Service', amount: 1200 },
      { name: 'Extra Activities', amount: 500 }
    ]
  },
  LKG: {
    mandatory: [
      { name: 'Tuition Fee', amount: 4000 },
      { name: 'Lab Fee', amount: 200 }
    ],
    optional: [
      { name: 'Bus Service', amount: 1200 },
      { name: 'Sports Classes', amount: 600 }
    ]
  },
  UKG: {
    mandatory: [
      { name: 'Tuition Fee', amount: 4500 },
      { name: 'Lab Fee', amount: 300 }
    ],
    optional: [
      { name: 'Bus Service', amount: 1200 },
      { name: 'Computer Classes', amount: 800 }
    ]
  },
  '1': {
    mandatory: [
      { name: 'Tuition Fee', amount: 5000 },
      { name: 'Lab Fee', amount: 500 },
      { name: 'Sports Fee', amount: 300 }
    ],
    optional: [
      { name: 'Bus Service', amount: 1500 },
      { name: 'Coaching Classes', amount: 1000 },
      { name: 'Hostel Facility', amount: 3000 }
    ]
  },
  '10': {
    mandatory: [
      { name: 'Tuition Fee', amount: 6500 },
      { name: 'Lab Fee', amount: 1000 },
      { name: 'Sports Fee', amount: 400 }
    ],
    optional: [
      { name: 'Bus Service', amount: 1500 },
      { name: 'Coaching Classes', amount: 1500 },
      { name: 'Hostel Facility', amount: 3500 }
    ]
  }
};

async function initializeAllClassFees() {
  console.log('\n=== Initializing Standard Fees for All Classes ===\n');
  
  const classes = await getClassesForDropdown();
  if (!classes) return;
  
  for (const classData of classes) {
    const className = classData.displayName;
    const structure = standardFeeStructure[className];
    
    if (structure) {
      console.log(`Setting up fees for ${className}...`);
      try {
        const result = await assignFeeCategoriesToClass(classData._id, structure);
        console.log(`✓ ${className}: ${result.data.created.length} items created`);
      } catch (err) {
        console.error(`✗ ${className}: ${err.message}`);
      }
    }
  }
  
  console.log('\n=== All classes initialized! ===\n');
}

// ============================================================================
// TESTING IN NODE.JS
// ============================================================================
// Run this script in Node.js:
// 
// 1. Install axios if not already installed:
//    npm install axios
// 
// 2. Create a test file (e.g., test-fees.js) with this content:
//
// const axios = require('axios');
// 
// const API_URL = 'http://localhost:5000/api/fees';
// const TOKEN = 'YOUR_AUTH_TOKEN'; // Get from login response
// 
// const api = axios.create({
//   baseURL: API_URL,
//   headers: {
//     'Authorization': `Bearer ${TOKEN}`,
//     'Content-Type': 'application/json'
//   }
// });
// 
// // Test the endpoints
// async function test() {
//   try {
//     // Get classes
//     const classesRes = await api.get('/classes-dropdown');
//     console.log('Classes:', classesRes.data);
//     
//     const classId = classesRes.data.data[0]._id;
//     
//     // Get fee structure
//     const structureRes = await api.get(`/class/${classId}/fee-structure`);
//     console.log('Structure:', structureRes.data);
//     
//     // Assign categories
//     const assignRes = await api.post(`/class/${classId}/assign-categories`, {
//       mandatory: [
//         { name: 'Test Fee', amount: 1000 }
//       ],
//       optional: []
//     });
//     console.log('Assigned:', assignRes.data);
//   } catch (err) {
//     console.error('Error:', err.response?.data || err.message);
//   }
// }
// 
// test();
// 
// 3. Run the test:
//    node test-fees.js

// ============================================================================
// KEY FEATURES
// ============================================================================
//
// ✓ CLASS ORDERING
//   - Classes automatically sorted: Nursery, LKG, UKG, 1, 2, ..., 10
//   - No manual ordering needed in frontend
//
// ✓ MANDATORY FEES
//   - Automatically applied to all students in the class
//   - Used in invoice generation to populate mandatory items
//   - Examples: Tuition, Lab, Sports, etc.
//
// ✓ OPTIONAL FEES
//   - Can be selected per student during fee collection
//   - Allows flexibility (e.g., Bus only for some students)
//   - Examples: Bus, Hostel, Extra Classes, etc.
//
// ✓ EASY UPDATE
//   - Can reassign categories anytime
//   - Creates new categories, updates existing ones
//   - Tracks created, updated, and error items
//
// ✓ SUMMARY STATISTICS
//   - Total mandatory amount
//   - Total optional amount
//   - Grand total for the class
//   - Item counts

module.exports = {
  getClassesForDropdown,
  getClassFeeStructure,
  assignFeeCategoriesToClass,
  completeFeeCategoryWorkflow,
  initializeAllClassFees,
  standardFeeStructure
};
