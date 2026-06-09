# Fee Category Assignment Feature - Complete Guide

## Overview

This feature allows school administrators to assign **mandatory** and **optional** fee categories to classes with proper class ordering (Nursery, LKG, UKG, 1-10).

### Key Concepts

- **Mandatory Fees**: Applied automatically to all students in a class (e.g., Tuition, Lab Fee)
- **Optional Fees**: Can be selected per student (e.g., Bus Service, Hostel, Coaching)
- **Class Ordering**: Automatically sorted as Nursery → LKG → UKG → 1 → 2 → ... → 10

---

## Backend Implementation

### 1. Class Sorting Utility (`server/src/utils/classUtils.js`)

Provides functions for proper class ordering:

```javascript
// Sort classes in proper order
const sorted = classUtils.sortClasses(classes);

// Get class order value (0=Nursery, 1=LKG, 2=UKG, 3-12=1-10)
const order = classUtils.getClassOrder('Class 1');

// Get all expected class names
const names = classUtils.getAllClassNames();
// Output: ['Nursery', 'LKG', 'UKG', '1', '2', '3', ..., '10']
```

### 2. Controller Functions (`server/src/controllers/feeController.js`)

Three new endpoints added:

#### a. `getClassesForDropdown()`
- **Endpoint**: `GET /api/fees/classes-dropdown`
- **Purpose**: Fetch all classes in proper sorted order
- **Response**:
  ```json
  {
    "success": true,
    "count": 13,
    "data": [
      {
        "_id": "60d5ec49c1234567890abcd1",
        "name": "Nursery",
        "displayName": "Nursery",
        "order": 0,
        "index": 0
      },
      // ... more classes
    ]
  }
  ```

#### b. `getClassFeeStructureWithSeparation()`
- **Endpoint**: `GET /api/fees/class/:classId/fee-structure`
- **Purpose**: Get current fee structure with mandatory and optional items separated
- **Response**:
  ```json
  {
    "success": true,
    "classId": "60d5ec49c1234567890abcd1",
    "data": {
      "mandatory": {
        "items": [...],
        "total": 5500,
        "count": 2,
        "description": "Applied automatically to all students"
      },
      "optional": {
        "items": [...],
        "total": 4500,
        "count": 2,
        "description": "Can be selected by individual students"
      },
      "summary": {
        "totalMandatory": 5500,
        "totalOptional": 4500,
        "grandTotal": 10000,
        "totalCategories": 4
      }
    }
  }
  ```

#### c. `assignFeeCategoryToClass()`
- **Endpoint**: `POST /api/fees/class/:classId/assign-categories`
- **Purpose**: Create or update fee categories for a class
- **Request Body**:
  ```json
  {
    "mandatory": [
      {
        "name": "Tuition Fee",
        "amount": 5000,
        "description": "Monthly tuition charges"
      },
      {
        "name": "Lab Fee",
        "amount": 500,
        "description": "Science laboratory usage"
      }
    ],
    "optional": [
      {
        "name": "Bus Service",
        "amount": 1500,
        "description": "Daily transportation"
      },
      {
        "name": "Hostel Facility",
        "amount": 3000,
        "description": "Residential accommodation"
      }
    ]
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "message": "Successfully assigned 4 new and updated 0 categories",
    "data": {
      "created": [
        {
          "name": "Tuition Fee",
          "type": "mandatory",
          "_id": "60d5ec49c1234567890abcd3",
          "amount": 5000
        }
      ],
      "updated": [],
      "errors": []
    }
  }
  ```

### 3. Routes (`server/src/routes/fees.js`)

New routes added:

```javascript
// Get classes in proper sorted order
router.get('/classes-dropdown', auth, roles(['superadmin','admin','principal','accountant']), 
  feeController.getClassesForDropdown);

// Assign/create fee categories for a class
router.post('/class/:classId/assign-categories', auth, roles(['superadmin','admin','principal','accountant']), 
  feeController.assignFeeCategoryToClass);

// Get fee structure with separation
router.get('/class/:classId/fee-structure', auth, roles(['superadmin','admin','principal','accountant']), 
  feeController.getClassFeeStructureWithSeparation);
```

---

## Frontend Implementation

### Component: `CreateFeeCategory.jsx`

Located at `frontend/src/components/CreateFeeCategory.jsx`

#### Features

1. **Two-Step Workflow**
   - Step 1: Select a class from properly sorted dropdown
   - Step 2: Add mandatory and optional fees

2. **Smart Form**
   - Add/remove fee items dynamically
   - Validate required fields
   - Show current fee structure before updating

3. **Visual Feedback**
   - Color-coded sections (mandatory vs optional)
   - Real-time summary calculation
   - Success/error messages

#### Usage in Your App

```jsx
import CreateFeeCategory from './components/CreateFeeCategory';

function AdminPanel() {
  return (
    <div>
      <CreateFeeCategory />
    </div>
  );
}
```

#### Component Props

None required - component is self-contained.

#### Component State

- `step`: Current workflow step (1 or 2)
- `classes`: List of sorted classes
- `selectedClass`: Currently selected class
- `classDetails`: Current fee structure for selected class
- `mandatory`: Array of mandatory fee items
- `optional`: Array of optional fee items
- `loading`, `error`, `success`: Status messages

---

## Workflow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│          FEE CATEGORY ASSIGNMENT WORKFLOW                   │
└─────────────────────────────────────────────────────────────┘

STEP 1: SELECT CLASS
┌─────────────────────┐
│ Fetch Classes       │──→ Sorted: Nursery, LKG, UKG, 1-10
│ classUtils.js       │
└─────────────────────┘
         │
         ↓
   [User Selects]
         │
         ↓
STEP 2: ASSIGN FEES
┌──────────────────────────────┐
│ Fetch Current Structure       │
│ GET /class/:id/fee-structure │
└──────────────────────────────┘
         │
         ↓
    [Display Form]
    • Mandatory Section
    • Optional Section
         │
         ↓
   [User Fills Form]
         │
         ↓
┌──────────────────────────────┐
│ Submit Assignment            │
│ POST /assign-categories      │
│ • Create new items           │
│ • Update existing items      │
└──────────────────────────────┘
         │
         ↓
    [Success Message]
    [Refresh Structure]
```

---

## Integration with Invoice System

When generating invoices, the system uses the fee categories:

### Current Implementation (Existing)

The invoice system in `invoiceService.js` generates invoice items based on FeeStructure.

### Recommended Enhancement

Modify `invoiceService.createOrGetInvoice()` to:

1. **For Mandatory Fees**: Always include in invoice
2. **For Optional Fees**: Include only if student has selected them

```javascript
// Example logic (in invoiceService.js)
async function createOrGetInvoice(studentId, month, year) {
  // Get fee categories for student's class
  const categories = await FeeCategory.find({ classId: student.classId });
  
  const mandatory = categories.filter(c => c.categoryType === 'Mandatory Fee');
  const optional = categories.filter(c => c.categoryType === 'Optional Service');
  
  // Add mandatory items to invoice
  const invoiceItems = mandatory.map(cat => ({
    categoryId: cat._id,
    name: cat.name,
    amount: cat.amount,
    type: 'mandatory'
  }));
  
  // Add selected optional items
  const studentOptional = await StudentOptionalFees.findOne({ 
    studentId, 
    classId: student.classId 
  });
  
  if (studentOptional) {
    for (const catId of studentOptional.selectedCategories) {
      const cat = optional.find(c => c._id.toString() === catId.toString());
      if (cat) {
        invoiceItems.push({
          categoryId: cat._id,
          name: cat.name,
          amount: cat.amount,
          type: 'optional'
        });
      }
    }
  }
  
  // Create invoice with items
  return await Invoice.create({
    studentId,
    month,
    year,
    items: invoiceItems,
    // ... other fields
  });
}
```

---

## API Testing

### Quick Test with cURL

```bash
# 1. Get classes in sorted order
curl -X GET http://localhost:5000/api/fees/classes-dropdown \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"

# 2. Get current fee structure
curl -X GET http://localhost:5000/api/fees/class/60d5ec49c1234567890abcd1/fee-structure \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"

# 3. Assign categories
curl -X POST http://localhost:5000/api/fees/class/60d5ec49c1234567890abcd1/assign-categories \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "mandatory": [
      { "name": "Tuition Fee", "amount": 5000, "description": "Monthly tuition" },
      { "name": "Lab Fee", "amount": 500, "description": "Lab usage" }
    ],
    "optional": [
      { "name": "Bus Service", "amount": 1500, "description": "Transportation" }
    ]
  }'
```

### Test with Node.js

See `server/src/scripts/testFeeCategoryAssignment.js` for:
- Complete function definitions
- Workflow examples
- Standard fee structure initialization

Run tests:

```bash
cd server
node src/scripts/testFeeCategoryAssignment.js
```

---

## Database Models

### FeeCategory Model

```javascript
{
  _id: ObjectId,
  classId: ObjectId,        // Reference to Class
  name: String,             // "Tuition Fee", "Bus Service", etc.
  amount: Number,           // Fee amount in rupees
  description: String,      // Optional description
  categoryType: String,     // "Mandatory Fee" OR "Optional Service"
  status: String,          // "active" OR "inactive"
  createdAt: Date,
  updatedAt: Date
}
```

### Index for Performance

```javascript
// Add to FeeCategory schema
db.feecategories.createIndex({ classId: 1, categoryType: 1 });
db.feecategories.createIndex({ classId: 1, name: 1 });
```

---

## Class Ordering Logic

Classes are sorted using the priority system:

| Class Name | Sort Order | Display |
|-----------|-----------|---------|
| Nursery | 0 | Nursery |
| LKG | 1 | LKG |
| UKG | 2 | UKG |
| 1 | 3 | 1 |
| 2 | 4 | 2 |
| ... | ... | ... |
| 10 | 12 | 10 |

The sorting is case-insensitive and handles variations (e.g., "class 1", "Class 1", "1").

---

## Common Tasks

### Task 1: Set Up Fees for a New Class

```javascript
const classId = '60d5ec49c1234567890abcd1';

const response = await axios.post('/api/fees/class/' + classId + '/assign-categories', {
  mandatory: [
    { name: 'Tuition Fee', amount: 5000 },
    { name: 'Lab Fee', amount: 500 }
  ],
  optional: [
    { name: 'Bus Service', amount: 1500 }
  ]
});
```

### Task 2: Update Existing Fees

Send the same request with new amounts - matching items will be updated:

```javascript
const response = await axios.post('/api/fees/class/' + classId + '/assign-categories', {
  mandatory: [
    { name: 'Tuition Fee', amount: 5500 }  // Updated from 5000
  ],
  optional: []
});
```

### Task 3: Get Current Fees for a Class

```javascript
const response = await axios.get('/api/fees/class/' + classId + '/fee-structure');

console.log('Mandatory items:', response.data.data.mandatory.items);
console.log('Optional items:', response.data.data.optional.items);
console.log('Total:', response.data.data.summary.grandTotal);
```

### Task 4: Display Class Dropdown (Properly Sorted)

```javascript
const response = await axios.get('/api/fees/classes-dropdown');

const options = response.data.data.map(cls => (
  <option key={cls._id} value={cls._id}>
    {cls.displayName}
  </option>
));
```

---

## Troubleshooting

### Issue: Classes not appearing in dropdown

**Solution**: Ensure classes exist in database with valid names (Nursery, LKG, UKG, 1-10)

```bash
# Check classes in database
db.classes.find({}, { name: 1 }).sort({ _id: 1 })
```

### Issue: Class order is wrong

**Solution**: The sorting is automatic. Check that class names match expected values:
- "Nursery" (case-insensitive)
- "LKG" (case-insensitive)
- "UKG" (case-insensitive)
- Numbers 1-10 as strings or integers

### Issue: Cannot create categories

**Solution**: Check that:
1. User has proper role (superadmin, admin, principal, accountant)
2. Authorization token is valid
3. Class ID is correct and class exists

---

## Summary

✅ **What was implemented:**
- Class sorting utility for proper ordering (Nursery, LKG, UKG, 1-10)
- Backend endpoints for fee category management
- React component for user-friendly fee assignment
- Support for mandatory (auto-applied) and optional (per-student) fees

✅ **Key files created:**
- `server/src/utils/classUtils.js` - Sorting utilities
- Enhanced `server/src/controllers/feeController.js` - New endpoints
- Enhanced `server/src/routes/fees.js` - New routes
- `frontend/src/components/CreateFeeCategory.jsx` - React component
- `server/src/scripts/testFeeCategoryAssignment.js` - Test examples

✅ **Next steps:**
- Integrate with invoice system to apply mandatory/optional fees
- Create StudentOptionalFees model to track per-student optional selections
- Add UI component to allow students/parents to select optional fees
- Create admin dashboard for fee structure management
