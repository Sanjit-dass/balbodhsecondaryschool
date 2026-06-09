Fee Management Module

Overview
- Backend: Node.js + Express + MongoDB (Mongoose)
- Frontend: React + Tailwind CSS

Quick start (development)

1) Server

Install and run the server:

```powershell
cd server
npm install
# set MONGODB_URL and JWT_SECRET in .env
npm run dev
```

2) Frontend

```powershell
cd frontend
npm install
npm run dev
```

API endpoints (new)
- `GET /api/fees/dashboard` — dashboard summary
- `GET /api/fees/class/:classId/students` — students list for class
- `GET /api/fees/student/:studentId` — student fee profile
- `POST /api/fees/collect` — collect fee and generate receipt (returns base64 PDF)
- `GET /api/fees/student/:studentId/history` — payment history

Notes
- Backend uses `pdfkit` and `qrcode` (already in server deps). Ensure `server/package.json` has those packages installed.
- Frontend pages are added under `frontend/src/pages` and components under `frontend/src/components/fee`.
