# Balbodh School - Backend

Setup:

1. Copy `.env.example` to `.env` and fill `MONGO_URI` and `JWT_SECRET`.
2. Install dependencies:

```bash
cd server
npm install

If you add new dependencies (Cloudinary support), run:

```bash
npm install cloudinary multer-storage-cloudinary
```
```

3. Run in dev:

```bash
npm run dev
```

APIs:
- `POST /api/auth/register` - register user
- `POST /api/auth/login` - login
- `GET /api/dashboard` - basic stats
- `REST /api/students` - student CRUD

Notes: This is a minimal scaffold. Production deployment should secure env vars, configure CORS origins, enable HTTPS, add rate-limiting and email service for password resets. File uploads are handled via Cloudinary in production.

Additional utilities:

- Seed initial superadmin:

```bash
cd server
node scripts/seedAdmin.js
```

 - File uploads: POST `/api/uploads` with `multipart/form-data` field `file`. Uses Cloudinary when `CLOUDINARY_URL` is configured in `.env`.

Environment:
- Set `CLOUDINARY_URL` in `.env` (format: `cloudinary://API_KEY:API_SECRET@CLOUD_NAME`). The server will use this automatically.

Security and production notes:
- Ensure `.env` does NOT include plain credentials in your repository.
- Provide a Firebase service account JSON and set `FIREBASE_SERVICE_ACCOUNT_PATH` accordingly.
- Configure SMTP credentials for password reset emails.

