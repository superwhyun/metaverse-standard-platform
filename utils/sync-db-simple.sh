#!/bin/bash

# 간단한 DB 동기화 스크립트
# Usage: ./sync-db-simple.sh

echo "🔄 Syncing remote DB to local..."

# Export, clear, and restore in one pipeline
wrangler d1 export metaverse-standards-dev --output remote-backup.sql --remote && \
grep "INSERT INTO" remote-backup.sql | grep -v "d1_migrations" > insert-only.sql && \
wrangler d1 execute metaverse-standards-dev --local --command="DELETE FROM users; DELETE FROM conferences; DELETE FROM reports; DELETE FROM organizations; DELETE FROM categories; DELETE FROM tech_analysis_reports;" && \
wrangler d1 execute metaverse-standards-dev --local --file insert-only.sql && \
rm insert-only.sql && \
echo "✅ Sync completed!"