# Scripts

Utility scripts used for maintenance and local development.

Available scripts

- `restoreDefaultClasses.js` — Detects missing master class records (Nursery, LKG, UKG, 1..10) and recreates only the missing entries. Safe to run multiple times.
  - Usage:
    ```bash
    cd server
    node scripts/restoreDefaultClasses.js
    # Or with npm:
    npm run restore:classes
    ```

- `listClasses.js` — Prints current documents in the `Classes` collection for verification.
  - Usage:
    ```bash
    cd server
    node scripts/listClasses.js
    # Or with npm:
    npm run list:classes
    ```

Notes
- These scripts use the `MONGODB_URL` value from `server/.env` (or the environment) to connect to the production/dev database. Ensure you understand which database you're connected to before running in production.
- The restore script only creates missing class documents and does not modify student, exam, attendance, or fee records.
