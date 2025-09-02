#!/bin/bash

# Cloudflare D1 데이터베이스 동기화 스크립트
# 원격 DB -> 로컬 DB 동기화

set -e

echo "🚀 Starting database synchronization..."
echo "=================================="

DB_NAME="metaverse-standards-dev"
BACKUP_FILE="remote-backup.sql"
INSERT_FILE="insert-only.sql"

# 1. 원격 데이터베이스에서 백업 생성
echo "📥 Exporting data from remote database..."
wrangler d1 export $DB_NAME --output $BACKUP_FILE --remote

if [ $? -ne 0 ]; then
    echo "❌ Failed to export remote database"
    exit 1
fi

echo "✅ Successfully exported remote data to $BACKUP_FILE"

# 2. INSERT 구문만 추출 (마이그레이션 제외)
echo "🔧 Extracting INSERT statements..."
grep "INSERT INTO" $BACKUP_FILE | grep -v "d1_migrations" > $INSERT_FILE

INSERT_COUNT=$(wc -l < $INSERT_FILE)
echo "✅ Extracted $INSERT_COUNT INSERT statements"

# 3. 로컬 데이터베이스 초기화
echo "🧹 Clearing local database tables..."

# 모든 테이블의 데이터 삭제 (스키마는 유지)
tables=("users" "conferences" "reports" "organizations" "categories" "tech_analysis_reports" "wordcloud_stopwords")

for table in "${tables[@]}"; do
    echo "  - Clearing $table table..."
    wrangler d1 execute $DB_NAME --local --command="DELETE FROM $table;" > /dev/null 2>&1 || {
        echo "    ⚠️  Table $table might not exist or already empty"
    }
done

echo "✅ Local database tables cleared"

# 4. 원격 데이터를 로컬에 복원
echo "📤 Restoring data to local database..."
wrangler d1 execute $DB_NAME --local --file $INSERT_FILE > /dev/null

if [ $? -ne 0 ]; then
    echo "❌ Failed to restore data to local database"
    exit 1
fi

echo "✅ Successfully restored $INSERT_COUNT records to local database"

# 5. 동기화 검증
echo "🔍 Verifying synchronization..."

echo "Database record counts:"
echo "----------------------"

for table in "${tables[@]}"; do
    if [ "$table" != "users" ]; then  # users 테이블은 보안상 제외
        LOCAL_COUNT=$(wrangler d1 execute $DB_NAME --local --command="SELECT COUNT(*) as count FROM $table;" 2>/dev/null | grep -o '"count":[0-9]*' | grep -o '[0-9]*' || echo "0")
        echo "  $table: $LOCAL_COUNT records"
    fi
done

# 6. 임시 파일 정리
echo "🧹 Cleaning up temporary files..."
rm -f $INSERT_FILE

echo ""
echo "🎉 Database synchronization completed successfully!"
echo "=================================="
echo "ℹ️  Backup file '$BACKUP_FILE' has been kept for reference."
echo "ℹ️  You can now use your local development environment with the latest data."