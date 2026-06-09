# 🔒 BALBODH ERP - API SECURITY REFERENCE GUIDE

## 📡 PROTECTED ROUTES CONFIGURATION

All API routes follow this protection pattern:

```javascript
router.method('/endpoint',
  auth,                           // ← Verify JWT token
  roles(['role1', 'role2']),      // ← Check user.role
  [validators],                   // ← Validate input
  validate,                       // ← Run express-validator
  audit('action_name'),           // ← Log to audit trail
  controller                      // ← Execute handler
);
```

---

## 📋 COMPLETE ROUTE SECURITY MATRIX

### **Authentication Routes** (`/api/auth`)

| Route | Method | Auth | Role | Access | Purpose |
|-------|--------|------|------|--------|---------|
| `/login` | POST | ✗ | ✗ | Public | User login |
| `/register` | POST | ✗ | ✗ | Public | Student/Parent signup |
| `/create-user` | POST | ✅ | admin/principal | Admin only | Create any user |
| `/refresh` | POST | ✗ | ✗ | Public | Refresh JWT |
| `/update-profile` | PUT | ✅ | All | Self only | Update own profile |
| `/logout` | POST | ✅ | All | Auth | Invalidate token |
| `/me` | GET | ✅ | All | Auth | Get current user |
| `/forgot` | POST | ✗ | ✗ | Public | Password reset request |
| `/reset/:token` | POST | ✗ | ✗ | Public | Reset password |

---

### **User Management** (`/api/users`)

| Route | Method | Auth | Role | Access |
|-------|--------|------|------|--------|
| `/` | GET | ✅ | admin/principal | List all users |
| `/` | POST | ✅ | admin/principal | Create user |
| `/:id` | GET | ✅ | admin/principal | Get user details |
| `/:id` | PUT | ✅ | admin/principal | Update user |
| `/:id` | DELETE | ✅ | admin/principal | Delete user |

---

### **Student Management** (`/api/students`)

| Route | Method | Auth | Role | Who Can Access |
|-------|--------|------|------|---|
| `/ (POST)` | POST | ✅ | superadmin, admin, principal, teacher, accountant | Create student |
| `/ (GET)` | GET | ✅ | superadmin, admin, principal, teacher, accountant, parent | List students |
| `/:id` | GET | ✅ | superadmin, admin, principal, teacher, accountant, parent | Get student |
| `/:id` | PUT | ✅ | superadmin, admin, principal, teacher, accountant | Update student |
| `/:id` | DELETE | ✅ | superadmin, admin, principal | Delete student |
| `/export/csv` | GET | ✅ | superadmin, admin, principal, teacher, accountant | Export CSV |

---

### **Teacher Management** (`/api/teachers`)

| Route | Method | Auth | Role | Access |
|-------|--------|------|------|--------|
| `/` | GET | ✅ | superadmin, admin, principal | List teachers |
| `/` | POST | ✅ | superadmin, admin, principal | Create teacher |
| `/:id` | GET | ✅ | superadmin, admin, principal | Get teacher |
| `/:id` | PUT | ✅ | superadmin, admin, principal | Update teacher |
| `/:id` | DELETE | ✅ | superadmin, admin, principal | Delete teacher |

---

### **Classes** (`/api/classes`)

| Route | Method | Auth | Role | Access |
|-------|--------|------|------|--------|
| `/` | GET | ✅ | All authenticated | List classes |
| `/` | POST | ✅ | superadmin, admin, principal | Create class |
| `/:id` | PUT | ✅ | superadmin, admin, principal | Update class |
| `/:id` | DELETE | ✅ | superadmin, admin, principal | Delete class |
| `/export/csv` | GET | ✅ | superadmin, admin, principal | Export |

---

### **Attendance** (`/api/attendance`)

| Route | Method | Auth | Role | Access |
|-------|--------|------|------|--------|
| `/` (POST) | POST | ✅ | superadmin, admin, principal, teacher | Mark attendance |
| `/` (GET) | GET | ✅ | superadmin, admin, principal, teacher, accountant, parent | View attendance |
| `/:id` | PUT | ✅ | superadmin, admin, principal, teacher | Update attendance |
| `/:id` | DELETE | ✅ | superadmin, admin, principal, teacher | Delete attendance |
| `/export/csv` | GET | ✅ | superadmin, admin, principal, teacher, accountant | Export |

---

### **Exams** (`/api/exams`)

| Route | Method | Auth | Role | Access |
|-------|--------|------|------|--------|
| `/` | GET | ✅ | All authenticated | List exams |
| `/` | POST | ✅ | superadmin, principal, examcontroller | Create exam |
| `/:id` | PUT | ✅ | superadmin, principal, examcontroller | Update exam |
| `/:id` | DELETE | ✅ | superadmin, principal, examcontroller | Delete exam |

---

### **Results** (`/api/results`)

| Route | Method | Auth | Role | Access |
|-------|--------|------|------|--------|
| `/` | GET | ✅ | superadmin, admin, principal, teacher, examcontroller, student, parent | View results |
| `/` | POST | ✅ | superadmin, admin, principal, teacher, examcontroller | Create result |
| `/:id` | PUT | ✅ | superadmin, admin, principal, teacher, examcontroller | Update result |
| `/:id` | DELETE | ✅ | superadmin, admin, principal, examcontroller | Delete result |

---

### **Fees** (`/api/fees`)

| Route | Method | Auth | Role | Access |
|-------|--------|------|------|--------|
| `/` | POST | ✅ | superadmin, admin, principal, accountant | Create fee |
| `/` | GET | ✅ | superadmin, admin, principal, accountant, parent | View fees |
| `/:id` | PUT | ✅ | superadmin, admin, principal, accountant | Update fee |
| `/:id` | DELETE | ✅ | superadmin, admin, principal, accountant | Delete fee |
| `/export/csv` | GET | ✅ | superadmin, admin, principal, accountant, parent | Export |

---

### **Notices** (`/api/notices`)

| Route | Method | Auth | Role | Access |
|-------|--------|------|------|--------|
| `/` | GET | ✅ | All authenticated | List notices |
| `/` | POST | ✅ | superadmin, principal | Create notice |
| `/:id` | PUT | ✅ | superadmin, principal | Update notice |
| `/:id` | DELETE | ✅ | superadmin, principal | Delete notice |
| `/export/csv` | GET | ✅ | superadmin, principal, teacher, accountant | Export |

---

### **Library** (`/api/library`)

| Route | Method | Auth | Role | Access |
|-------|--------|------|------|--------|
| `/` | GET | ✅ | All authenticated | List books |
| `/` | POST | ✅ | superadmin, librarian, principal | Add book |
| `/:id` | PUT | ✅ | superadmin, librarian, principal | Update book |
| `/:id` | DELETE | ✅ | superadmin, librarian, principal | Delete book |

---

### **Audit Log** (`/api/audit`)

| Route | Method | Auth | Role | Access |
|-------|--------|------|------|--------|
| `/` | GET | ✅ | superadmin, admin, principal | View audit logs |
| `/export/csv` | GET | ✅ | superadmin, admin, principal | Export audit logs |

---

## 🔑 JWT TOKEN STRUCTURE

**Issued by:** `POST /api/auth/login`

**Payload:**
```json
{
  "user": {
    "id": "60d5ec49c1234567890abcd0",
    "role": "student"
  },
  "iat": 1624000000,
  "exp": 1624003600
}
```

**Valid Duration:** 1 hour (configurable via JWT_EXPIRES_IN)

**Stored In:** 
- localStorage (if "Remember me" checked)
- sessionStorage (default)

**Usage in Requests:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjp7ImlkIjoiNjBkNWVjNDljMTIzNDU2Nzg5MGFiY2QwIiwicm9sZSI6InN0dWRlbnQifSwiaWF0IjoxNjI0MDAwMDAwLCJleHAiOjE2MjQwMDM2MDB9.abc...
```

---

## ⚠️ ERROR RESPONSES

### **401 Unauthorized** (No/Invalid Token)
```json
{
  "message": "No token, authorization denied"
}
```

### **403 Forbidden** (Role Not Authorized)
```json
{
  "message": "Forbidden"
}
```

### **403 Forbidden** (Wrong Role on Login)
```json
{
  "message": "Selected role does not match account role."
}
```

### **400 Bad Request** (Validation Failed)
```json
{
  "message": "Validation error",
  "errors": [
    {
      "param": "email",
      "msg": "Invalid email"
    }
  ]
}
```

---

## 🔄 REFRESH TOKEN FLOW

### **Step 1: Get Refresh Token**
```
POST /api/auth/login
Response: { token, refreshToken, user }
```

### **Step 2: Store Safely**
- `token` → localStorage (Remember me) or sessionStorage
- `refreshToken` → httpOnly cookie (recommended) or localStorage

### **Step 3: Use Refresh Token**
```javascript
// When main token expires
POST /api/auth/refresh
Body: { refreshToken: "..." }
Response: { token: "new_token", user }
```

### **Step 4: Update Headers**
```javascript
api.defaults.headers.common['Authorization'] = `Bearer new_token`;
```

---

## 🛡️ SECURITY BEST PRACTICES

### **For Frontend Developers**
1. **Never** put JWT in URL query params
2. **Never** store JWT in localStorage for sensitive apps (use httpOnly cookies)
3. **Always** verify user role on protected components
4. **Always** refresh token before expiry
5. **Always** clear auth state on logout
6. Implement re-login flow when token expires

### **For Backend Developers**
1. **Never** return user password in any response
2. **Always** hash passwords with bcrypt
3. **Always** validate role on every protected endpoint
4. **Always** log sensitive actions to audit trail
5. Implement rate limiting on login endpoint
6. Use HTTPS in production
7. Set strong JWT secret (32+ characters)
8. Implement token blacklist on logout

### **For Devops/System Admins**
1. Set strong `JWT_SECRET` environment variable
2. Use `.env` file (never commit to git)
3. Enable HTTPS with valid SSL certificate
4. Configure CORS to production domain only
5. Enable GZIP compression
6. Set security headers (HSTS, X-Frame-Options, etc.)
7. Monitor failed login attempts
8. Implement automated backups
9. Set up error monitoring (e.g., Sentry)
10. Regular security audits

---

## 🧪 TESTING EXAMPLES

### **Test Protected Route (with valid token)**
```bash
JWT_TOKEN="eyJhbGc..."

curl -X GET http://localhost:5000/api/students \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json"

# Expected: 200 OK with student list
```

### **Test Wrong Role**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "student@school.com",
    "password": "password123",
    "role": "admin"
  }'

# Expected: 403 Forbidden
# Response: {"message": "Selected role does not match account role."}
```

### **Test Expired Token**
```bash
# Wait for token to expire (1 hour default)
curl -X GET http://localhost:5000/api/students \
  -H "Authorization: Bearer expired_token"

# Expected: 401 Unauthorized
# Response: {"message": "Token is not valid"}
```

### **Test Missing Token**
```bash
curl -X GET http://localhost:5000/api/students

# Expected: 401 Unauthorized
# Response: {"message": "No token, authorization denied"}
```

---

## 📊 RATE LIMITING RECOMMENDATION

Implement on these endpoints:

| Endpoint | Limit | Window |
|----------|-------|--------|
| POST /api/auth/login | 5 attempts | 15 minutes |
| POST /api/auth/forgot | 3 attempts | 1 hour |
| POST /api/auth/reset | 3 attempts | 1 hour |
| POST /api/auth/register | 10 requests | 1 hour |
| Other POST | 100 requests | 1 hour |
| Other GET | 1000 requests | 1 hour |

**Implementation:** Use `express-rate-limit` package

---

## 🚀 DEPLOYMENT CHECKLIST

- [ ] JWT_SECRET set to strong random value (32+ chars)
- [ ] MONGODB_URL set to production database
- [ ] NODE_ENV=production
- [ ] CORS_ORIGIN set to production domain
- [ ] HTTPS enforced
- [ ] Rate limiting enabled
- [ ] Error logging configured (Sentry/LogRocket)
- [ ] Performance monitoring setup
- [ ] Database backups automated daily
- [ ] Log rotation configured
- [ ] Monitor failed login attempts
- [ ] Security headers configured in nginx/reverse proxy

---

**Last Updated:** May 31, 2026  
**Version:** 1.0.0  
**Status:** PRODUCTION-READY ✅
