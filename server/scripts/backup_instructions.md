Backup and Restore

This project uses MongoDB Atlas for production. For backups:

- Use Atlas continuous backups or on-demand snapshots via the Atlas UI.
- For local or scripted backups, use `mongodump`:

```bash
# export data
mongodump --uri="$MONGO_URI" --archive=backup-$(date +%F).gz --gzip

# restore
mongorestore --uri="$MONGO_URI" --archive=backup-2024-01-01.gz --gzip
```

Notes:
- Ensure `mongodump`/`mongorestore` are installed and network access to Atlas is configured.
- Atlas provides point-in-time restore and backup features for production.
