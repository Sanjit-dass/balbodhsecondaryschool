# Student Photo Upload Feature

## Overview
This feature enables admins to upload student photos in the Student Management system, which are then automatically displayed on admit cards across all portals.

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    STUDENT MANAGEMENT                       │
│                  (StudentForm.jsx)                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. Select Photo File          2. Upload to Server         │
│     (JPG/PNG, max 5MB)             (FileUploader)          │
│           ↓                          ↓                      │
│     [Preview shown]            [Progress bar]              │
│           ↓                          ↓                      │
│  3. Success Message            4. Save Student              │
│     "Photo uploaded! ✓"           (with photo URL)         │
│           ↓                          ↓                      │
│     Student saved in database                               │
│           ↓                                                 │
└─────────────────────────────────────────────────────────────┘
                           ↓
        ┌──────────────────┴──────────────────┐
        │                                     │
        ↓                                     ↓
┌─────────────────┐              ┌─────────────────────┐
│ ADMIN PORTAL    │              │ STUDENT PORTALS     │
│ (AdminAdmitCard)│              │ (AdmitCard)         │
├─────────────────┤              ├─────────────────────┤
│ • Photo Preview │              │ • Accountant View   │
│ • Photo Section │              │ • Student Self-View │
│ • Bulk Export   │              │ • Dashboard Card    │
└─────────────────┘              └─────────────────────┘
        ↓                                     ↓
        │         Photo displays if exists   │
        └──────────────────┬─────────────────┘
                           ↓
                    Student Admit Card
                    ✓ Photo in top-right (if available)
                    ✓ Layout adjusts when photo hidden
```

## Features

### 1. Photo Upload (StudentForm.jsx)

**UI Components:**
- 📸 Label: "Student Photo Upload"
- File info: "JPG, PNG (Max 5MB)"
- File input with FileUploader component
- Preview area showing current or selected photo
- Placeholder when no photo

**Workflow:**
1. User selects image file
2. FileUploader validates:
   - File type (must be image)
   - File size (max 5MB)
3. User clicks Upload button
4. File uploaded to server (`/api/uploads?folder=students`)
5. Photo URL returned and saved to form
6. Success message appears for 3 seconds
7. User clicks Save Student
8. Photo URL saved to database

### 2. File Upload Component (FileUploader.jsx)

**Validation:**
- File size: max 5MB
- File type: images only (JPG, PNG)
- Error messages for validation failures

**Features:**
- Real-time upload progress (0-100%)
- Image preview
- File info display (name + size)
- Success/error messages
- Auto-clear success message after 3 seconds

### 3. Student Model (server/src/models/Student.js)

**Photo Fields:**
- `photoUrl` - Primary field for photo URL
- `photo` - Alternative field
- `image` - Another alternative field
- `profilePhoto` - Legacy field
- `profilePhotoObj.fileUrl` - Cloudinary field

Multiple field support ensures compatibility with different data sources.

### 4. Admit Cards (All Portals)

All admit card implementations check for photos and display them conditionally:

**Files Updated:**
- `AdminAdmitCard.jsx` - Admin portal preview
- `AdmitCardView.jsx` - Accountant & Exam Controller portal
- `StudentAdmitCard.jsx` - Student self-service
- `AdmitCard.jsx` - Student dashboard

**Photo Detection Logic:**
```javascript
const hasPhoto = student?.profilePhoto || 
                 student?.profilePhotoUrl || 
                 student?.photoUrl || 
                 student?.photo || 
                 student?.image || 
                 student?.profilePhotoObj?.fileUrl;

if (hasPhoto) {
  // Display photo
} else {
  // Hide photo section completely (no placeholder)
}
```

## Data Flow

### Upload Workflow
```
1. User selects image file in Student Management
   ↓
2. FileUploader validates (type, size)
   ↓
3. POST /uploads?folder=students (with FormData)
   ↓
4. Server stores file and returns URL
   ↓
5. StudentForm receives URL via onUploaded callback
   ↓
6. Photo URL updated in form state
   ↓
7. User clicks Save Student
   ↓
8. PUT /students/:id with { photoUrl, photo: photoUrl }
   ↓
9. Database updated with photo URL
```

### Display Workflow
```
1. Admit Card page loads
   ↓
2. Fetch student data from API
   ↓
3. Check all photo field names
   ↓
4. If photo exists → Display in top-right corner
   ↓
5. If not exists → Hide photo section completely
   ↓
6. Layout automatically adjusts based on photo presence
```

## Validation & Error Handling

### Client-Side Validation
- ✅ File type must be image (JPG/PNG)
- ✅ File size must be ≤ 5MB
- ✅ File must be selected before uploading
- ✅ Upload must complete before saving student

### Server-Side Validation
- ✅ File upload endpoint validates
- ✅ Student update accepts photo URLs
- ✅ Database saves photo field

### Error Messages
- "Please select an image file (JPG, PNG)"
- "File size exceeds 5MB limit. Selected: X.XXMB"
- "Please upload the photo before saving. Click the Upload button next to the photo."

## Testing Guide

### Test 1: Upload Photo
```
1. Go to Student Management
2. Click Add New Student or Edit Student
3. Select JPG/PNG image (< 5MB)
4. Verify preview appears
5. Click Upload button
6. Verify progress bar shows
7. Verify success message "✓ Upload successful!"
8. Fill in other student details
9. Click Save Student
10. Verify "Student saved successfully!"
```

### Test 2: Photo Display on Admit Cards
```
1. After student saved with photo
2. Go to Admin Admit Card
3. Select class and exam
4. Verify photo appears in preview
5. Go to Accountant Portal → Admit Cards
6. View same student's admit card
7. Verify photo appears
8. Go to Student Portal → Admit Card
9. Generate admit card for student with photo
10. Verify photo displays
```

### Test 3: Validation
```
1. Try uploading file > 5MB
   ✓ Should show error "File size exceeds 5MB limit"
   
2. Try uploading non-image file (PDF, DOC)
   ✓ Should show error "Please select an image file"
   
3. Select file but don't click Upload
   ✓ Click Save Student
   ✓ Should show error "Please upload the photo before saving"
   
4. Try uploading without selecting file
   ✓ Upload button should be disabled
```

### Test 4: Photo Not Present
```
1. Create/edit student WITHOUT uploading photo
2. Go to any admit card portal
3. Verify photo section is completely hidden
4. Verify layout adjusts naturally
5. No empty boxes or placeholders
```

## File Locations

### Frontend
- `frontend/src/components/StudentForm.jsx` - Student form with photo upload
- `frontend/src/components/FileUploader.jsx` - File upload component
- `frontend/src/pages/Students.jsx` - Student management page
- `frontend/src/pages/AdminAdmitCard.jsx` - Admin admit card
- `frontend/src/pages/AdmitCardView.jsx` - Accountant/Exam Controller view
- `frontend/src/pages/StudentAdmitCard.jsx` - Student self-service
- `frontend/src/pages/AdmitCard.jsx` - Student dashboard

### Backend
- `server/src/models/Student.js` - Student schema
- `server/src/routes/students.js` - Student routes
- `server/src/routes/upload.js` - File upload endpoint

## Troubleshooting

### Photo Not Uploading
- Check file size (must be < 5MB)
- Check file type (must be JPG or PNG)
- Check browser console for errors
- Verify upload endpoint is working

### Photo Not Displaying on Admit Card
- Verify photo URL was saved to database
- Check student record has photoUrl/photo/image field
- Verify URL is accessible
- Check admit card code is checking correct field names

### Upload Stuck at 100%
- Check network connection
- Try refreshing page
- Try uploading different file
- Check server logs

## Performance Notes

- Photos are stored on server via `/uploads` endpoint
- File size limited to 5MB to prevent excessive storage
- Upload progress shown in real-time
- Multiple photo field names supported for backward compatibility

## Future Enhancements

- Image cropping/resizing
- Automatic image compression
- Support for more image formats
- Drag-and-drop upload
- Batch photo upload for multiple students
- Photo gallery view
