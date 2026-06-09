# 🚀 BALBODH SCHOOL ERP - PRODUCTION DEPLOYMENT GUIDE

## 📋 SYSTEM ARCHITECTURE

### **Role-Based Access Control (RBAC) Model**

```
ROLE HIERARCHY:
├── SUPERADMIN (system admin - not exposed to frontend, use 'admin' for UI)
├── ADMIN (system administrator)
├── PRINCIPAL (school principal)
├── TEACHER (teaching staff)
├── ACCOUNTANT (finance staff)
├── EXAMCONTROLLER (exam management)
├── STUDENT (learner account)
└── PARENT (guardian access)
```

### **Authentication Flow**

```
1. User selects role on /login/:role
2. Submits email + password + role
3. Backend validates:
   ✓ User exists with email
   ✓ Password matches
   ✓ User role === requested role
   ✓ Account is active
4. Generate JWT: { id, role }
5. Store in localStorage (if remember=true) or sessionStorage
6. Redirect to role-specific dashboard
7. All API requests include Authorization header
```

---

## 🔐 BACKEND IMPLEMENTATION

### **Authentication Middleware**

**File:** `server/src/middleware/auth.js`
- Extracts JWT from Authorization header
- Verifies token signature
- Attaches decoded user to req.user
- Returns 401 if invalid/missing

### **Role Middleware**

**File:** `server/src/middleware/roles.js`
- Checks req.user.role against allowed roles
- Returns 403 if unauthorized
- Must be placed AFTER auth middleware

### **Login Endpoint**

**File:** `server/src/controllers/authController.js` → `login()`

**Request:**
```json
{
  "email": "student@school.com",
  "password": "password123",
  "role": "student"
}
```

**Response (Success):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "abc123xyz...",
  "user": {
    "id": "user_id",
    "name": "John Doe",
    "email": "student@school.com",
    "role": "student"
  }
}
```

**Response (Failure - Role Mismatch):**
```json
{
  "message": "Selected role does not match account role."
}
```

### **Protected Route Pattern**

All protected routes follow this pattern:

```javascript
router.post('/path', 
  auth,                              // Verify JWT
  roles(['admin', 'teacher']),       // Check role
  [body validators],                 // Validate input
  validate,                          // Run validators
  audit('action_name'),              // Log to audit
  controller                         // Execute
);
```

---

## 🎨 FRONTEND IMPLEMENTATION

### **Authentication Context**

**File:** `frontend/src/contexts/AuthContext.jsx`

**State:**
- `user` - Current user object with role
- `token` - JWT token
- `isAuthenticated` - Boolean flag
- `loading` - Async operation state
- `error` - Error messages

**Methods:**
- `login(email, password, remember, role)` - Authenticate
- `logout()` - Clear auth state
- `updateProfile(data)` - Update user info

### **Protected Route Component**

**File:** `frontend/src/components/PrivateRoute.jsx`

**Behavior:**
1. If not authenticated → redirect to `/login`
2. If roles specified but user role not in list → redirect to user's home
3. Otherwise → render children

### **Login Page**

**File:** `frontend/src/pages/Login.jsx`

**Features:**
- Role selector cards
- `/login/:role` support
- Premium UI with glassmorphism
- Auto-redirect if already authenticated
- Role-specific login forms

### **Dashboard Routing**

**Pattern:**
```
/student/dashboard    → StudentPortal component
/teacher/dashboard    → TeacherPortal component
/admin/dashboard      → Dashboard component
/account/dashboard    → Fees component (accountant)
/exam/dashboard       → Exams component (exam controller)
```

### **Sidebar Role Menu**

**File:** `frontend/src/components/Sidebar.jsx`

**Feature:** Shows different menu items per role:
- **Student:** Dashboard, Attendance, Assignments, Results, Fees
- **Teacher:** Dashboard, Attendance, Assignments, Reports
- **Admin:** Dashboard, Management (Students, Teachers, Classes), Academic (Attendance, Exams, Assignments, Results), Administration (Fees, Library, Transport, Notices, Notifications, Uploads, Audit Log)
- **Accountant:** Dashboard, Fees
- **Exam Controller:** Dashboard, Exams, Results

---

## 📂 PROJECT STRUCTURE

### **Frontend**
```
frontend/
├── src/
│   ├── pages/
│   │   ├── Login.jsx                (role-specific login)
│   │   ├── Register.jsx             (student/parent only)
│   │   ├── Dashboard.jsx            (admin home)
│   │   ├── StudentPortal.jsx        (student home)
│   │   ├── TeacherPortal.jsx        (teacher home)
│   │   ├── ParentPortal.jsx         (parent home)
│   │   └── [other pages].jsx
│   ├── components/
│   │   ├── PrivateRoute.jsx         (role guard)
│   │   ├── Sidebar.jsx              (role menus)
│   │   ├── Layout.jsx               (page wrapper)
│   │   └── [feature components].jsx
│   ├── contexts/
│   │   ├── AuthContext.jsx          (auth state + login/logout)
│   │   └── LanguageContext.jsx      (bilingual support)
│   ├── services/
│   │   └── api.js                   (axios instance + JWT header)
│   └── App.jsx                      (route definitions)
```

### **Backend**
```
server/
├── src/
│   ├── middleware/
│   │   ├── auth.js                  (JWT verification)
│   │   ├── roles.js                 (role authorization)
│   │   ├── validate.js              (input validation)
│   │   ├── errorHandler.js          (error handling)
│   │   ├── security.js              (security headers)
│   │   └── audit.js                 (activity logging)
│   ├── controllers/
│   │   └── authController.js        (login, register, logout)
│   ├── routes/
│   │   ├── auth.js                  (auth endpoints)
│   │   └── [other routes].js
│   ├── models/
│   │   ├── User.js                  (user schema)
│   │   ├── Student.js
│   │   ├── Teacher.js
│   │   └── [other models].js
│   ├── config/
│   │   └── db.js                    (MongoDB connection)
│   └── index.js                     (express app setup)
```

---

## 🔑 ENVIRONMENT VARIABLES

### **Backend (.env)**
```
NODE_ENV=production
PORT=5000

# Database
MONGODB_URL=mongodb+srv://username:password@cluster.mongodb.net/balbodh

# JWT
JWT_SECRET=your-super-secret-key-minimum-32-characters
JWT_EXPIRES_IN=1h

# CORS
CORS_ORIGIN=https://balbodhschool.com,https://www.balbodhschool.com

# Email (optional for password reset)
EMAIL_SERVICE_HOST=smtp.gmail.com
EMAIL_SERVICE_PORT=587
EMAIL_SERVICE_USER=noreply@balbodhschool.com
EMAIL_SERVICE_PASS=your-app-password

# Frontend URL
FRONTEND_URL=https://balbodhschool.com
```

### **Frontend (.env.production)**
```
VITE_API_URL=https://api.balbodhschool.com
```

---

## 🧪 TESTING CHECKLIST

### **Authentication Tests**
- [ ] Student login works
- [ ] Teacher login works
- [ ] Admin login works
- [ ] Wrong role rejected (e.g., student tries as teacher)
- [ ] Invalid credentials rejected
- [ ] JWT token persists (remember me)
- [ ] Logout clears token

### **Route Protection Tests**
- [ ] Unauthenticated users redirected to /login
- [ ] Student cannot access /admin/dashboard
- [ ] Teacher cannot access /account/dashboard
- [ ] Admin can access all dashboards
- [ ] Role-mismatched access returns to role home

### **Sidebar Tests**
- [ ] Pre-login sidebar hidden
- [ ] Student sees correct menu
- [ ] Teacher sees correct menu
- [ ] Admin sees all menus
- [ ] Sidebar closes on mobile after nav

### **API Tests**
- [ ] Student endpoints return 403 for admin-only routes
- [ ] Teacher endpoints work for teacher-only routes
- [ ] Token refresh works
- [ ] Logout removes refresh token

---

## 🚀 DEPLOYMENT CHECKLIST

### **Pre-Deployment**
- [ ] All env variables set in production
- [ ] JWT_SECRET is strong (32+ chars)
- [ ] CORS_ORIGIN set to production domain only
- [ ] MongoDB connection tested
- [ ] SSL/TLS enabled
- [ ] Error messages don't leak system info

### **Server**
- [ ] Backend running on port 5000 or behind reverse proxy
- [ ] HTTPS enforced
- [ ] Rate limiting enabled
- [ ] CORS properly configured
- [ ] Security headers set (security.js middleware)

### **Frontend**
- [ ] Built with `npm run build`
- [ ] Served from production CDN/server
- [ ] Service worker configured (if using PWA)
- [ ] API_URL points to production backend

### **Monitoring**
- [ ] Error logging setup (e.g., Sentry)
- [ ] Performance monitoring (e.g., New Relic)
- [ ] Database backups automated
- [ ] Audit logs reviewed periodically

---

## 🔒 SECURITY BEST PRACTICES

1. **JWT Storage:** Use httpOnly cookies OR secure sessionStorage (never localStorage for sensitive data)
2. **CORS:** Whitelist production domain only
3. **Password Hashing:** Use bcrypt with salt rounds ≥ 10
4. **Rate Limiting:** Implement on login endpoint (e.g., 5 attempts/15min)
5. **API Validation:** Validate all inputs on backend
6. **SQL Injection:** Use Mongoose (not raw queries)
7. **XSS Prevention:** React auto-escapes, but sanitize HTML if needed
8. **CSRF:** Use SameSite cookie flag
9. **Audit Logs:** Log all sensitive actions
10. **Role Checks:** Always verify on backend, never trust frontend

---

## 📞 SUPPORT

For issues:
1. Check console for error messages
2. Verify JWT token in browser DevTools → Application → Storage
3. Check backend logs for 401/403 errors
4. Verify database connection
5. Ensure .env variables are set

---

**Last Updated:** May 31, 2026  
**Version:** 1.0.0 (Production-Ready)
