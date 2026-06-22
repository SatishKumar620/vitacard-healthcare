#!/bin/bash
set -e

echo "╔══════════════════════════════════════════════════════╗"
echo "║  VitaCard — All-in-One Container Bootstrap          ║"
echo "║  PostgreSQL + pgvector · n8n · Express Frontend      ║"
echo "╚══════════════════════════════════════════════════════╝"

# ── 1. Initialize PostgreSQL ────────────────────────────────
export PGDATA=/data/pgdata

if [ ! -f "$PGDATA/PG_VERSION" ]; then
  echo "▸ Initializing PostgreSQL data directory..."
  /usr/lib/postgresql/15/bin/initdb -D "$PGDATA" --auth=trust --username=vitacard
  
  cat >> "$PGDATA/postgresql.conf" <<EOF
listen_addresses = 'localhost'
port = 5432
unix_socket_directories = '/var/run/postgresql'
shared_buffers = 64MB
work_mem = 4MB
max_connections = 30
log_min_messages = warning
EOF

  cat > "$PGDATA/pg_hba.conf" <<EOF
local   all   all               trust
host    all   all   127.0.0.1/32   trust
host    all   all   ::1/128        trust
EOF
  echo "✓ PostgreSQL initialized."
else
  echo "✓ PostgreSQL data directory exists. Reusing."
fi

# Start PostgreSQL
echo "▸ Starting PostgreSQL..."
/usr/lib/postgresql/15/bin/pg_ctl -D "$PGDATA" -l /data/pgdata/postgresql.log start -w -t 30
echo "✓ PostgreSQL is running."

# ── 2. Create Database & Run Schema ─────────────────────────
echo "▸ Creating database vitacard_db..."
/usr/lib/postgresql/15/bin/psql -h /var/run/postgresql -U vitacard -d postgres \
  -tc "SELECT 1 FROM pg_database WHERE datname = 'vitacard_db'" | grep -q 1 \
  || /usr/lib/postgresql/15/bin/psql -h /var/run/postgresql -U vitacard -d postgres \
     -c "CREATE DATABASE vitacard_db;"
echo "✓ Database ready."

echo "▸ Running schema migration..."
/usr/lib/postgresql/15/bin/psql -h /var/run/postgresql -U vitacard -d vitacard_db -f /app/init_schema.sql
echo "✓ Schema applied."

# ── 3. Seed Doctors Data ────────────────────────────────────
echo "▸ Seeding doctors data..."
node /app/seed_doctors.js
echo "✓ Seeding complete."

# ── 4. Configure n8n Environment ────────────────────────────
export N8N_PORT=5678
export N8N_PROTOCOL=https
export N8N_PATH="/"
export N8N_ENCRYPTION_KEY="${N8N_ENCRYPTION_KEY:-vitacard-n8n-secret-key-2026}"
# Basic Auth is controlled by HF secrets — read from env
export N8N_BASIC_AUTH_ACTIVE=${N8N_BASIC_AUTH_ACTIVE:-false}
export N8N_BASIC_AUTH_USER=${N8N_BASIC_AUTH_USER:-admin}
export N8N_BASIC_AUTH_PASSWORD=${N8N_BASIC_AUTH_PASSWORD:-vitacard}
export N8N_RUNNERS_ENABLED=false
export N8N_DIAGNOSTICS_ENABLED=false
export N8N_TEMPLATES_ENABLED=false
export N8N_PERSONALIZATION_ENABLED=false

# Use SQLite for n8n internal data
export DB_TYPE=sqlite

# n8n webhook URL (no trailing slash)
if [ -n "$SPACE_ID" ]; then
  SPACE_HOST_NAME=$(echo "$SPACE_ID" | tr '/' '-')
  export WEBHOOK_URL="https://${SPACE_HOST_NAME}.hf.space"
  echo "✓ HF Space detected: WEBHOOK_URL=$WEBHOOK_URL"
else
  export WEBHOOK_URL="http://localhost:7860"
fi

export N8N_EDITOR_BASE_URL="${WEBHOOK_URL}/n8n/"

# ── Build Basic Auth header for internal API calls ───────────
if [ "$N8N_BASIC_AUTH_ACTIVE" = "true" ]; then
  BASIC_AUTH_HEADER="-u ${N8N_BASIC_AUTH_USER}:${N8N_BASIC_AUTH_PASSWORD}"
  echo "✓ Basic Auth is ACTIVE — internal API calls will use Basic Auth"
else
  BASIC_AUTH_HEADER=""
  echo "✓ Basic Auth is disabled"
fi

# ── 5. Clean slate: Remove old n8n database ──────────────────
echo "▸ Removing old n8n database for clean setup..."
rm -f /home/node/.n8n/database.sqlite /home/node/.n8n/database.sqlite-shm /home/node/.n8n/database.sqlite-wal
echo "✓ Clean slate ready."

# ── 6. Start n8n (1st boot — empty DB) ───────────────────────
echo "▸ Starting n8n (1st boot)..."
n8n start &
N8N_PID=$!

# Wait for n8n to be ready
echo "▸ Waiting for n8n to become ready..."
for i in $(seq 1 60); do
  if curl -s $BASIC_AUTH_HEADER http://localhost:5678/healthz > /dev/null 2>&1; then
    echo "✓ n8n is ready! (attempt $i)"
    break
  fi
  sleep 2
done

# ── 7. Auto-configure n8n via REST API ───────────────────────
echo "▸ Setting up n8n owner account..."
for i in $(seq 1 30); do
  N8N_SETUP_RESPONSE=$(curl -s $BASIC_AUTH_HEADER -X POST http://localhost:5678/rest/owner/setup \
    -H "Content-Type: application/json" \
    -d "{
      \"email\": \"${N8N_BASIC_AUTH_USER}\",
      \"firstName\": \"VitaCard\",
      \"lastName\": \"Admin\",
      \"password\": \"${N8N_BASIC_AUTH_PASSWORD}\"
    }" 2>/dev/null || echo '{}')
  
  echo "  Owner setup response: $(echo "$N8N_SETUP_RESPONSE" | head -c 200)"
  
  if echo "$N8N_SETUP_RESPONSE" | grep -q '"email"'; then
    echo "✓ Owner setup completed successfully!"
    break
  fi
  
  if echo "$N8N_SETUP_RESPONSE" | grep -q 'already'; then
    echo "✓ Owner setup already completed."
    break
  fi
  
  echo "  Setup not ready/failed. Retrying in 2 seconds... (attempt $i)"
  sleep 2
done

# Login to get auth cookie
echo "▸ Logging in to n8n..."
for i in $(seq 1 10); do
  LOGIN_RESPONSE=$(curl -s $BASIC_AUTH_HEADER -c /tmp/n8n-cookies.txt -X POST http://localhost:5678/rest/login \
    -H "Content-Type: application/json" \
    -d "{
      \"emailOrLdapLoginId\": \"${N8N_BASIC_AUTH_USER}\",
      \"password\": \"${N8N_BASIC_AUTH_PASSWORD}\"
    }")
  echo "  Login response: $(echo "$LOGIN_RESPONSE" | head -c 200)"
  
  if echo "$LOGIN_RESPONSE" | grep -q '"id"'; then
    echo "✓ Login succeeded!"
    break
  fi
  
  echo "  Login failed. Retrying in 2 seconds... (attempt $i)"
  sleep 2
done

if [ ! -f /tmp/n8n-cookies.txt ]; then
  echo "⚠ LOGIN COOKIES FILE MISSING! Setup cannot continue."
  exit 1
fi

# ── 8. Create n8n Credentials via REST API ──────────────────
# Create PostgreSQL credential
echo "▸ Creating PostgreSQL credential..."
PG_CRED_RESPONSE=$(curl -s $BASIC_AUTH_HEADER -b /tmp/n8n-cookies.txt -X POST http://localhost:5678/rest/credentials \
  -H "Content-Type: application/json" \
  -d '{
    "name": "PostgreSQL",
    "type": "postgres",
    "data": {
      "host": "127.0.0.1",
      "port": 5432,
      "database": "vitacard_db",
      "user": "vitacard",
      "password": "",
      "ssl": "disable"
    }
  }')

PG_CRED_ID=$(echo "$PG_CRED_RESPONSE" | node -e "
  let d=''; process.stdin.on('data',c=>d+=c); process.stdin.on('end',()=>{
    try { console.log(JSON.parse(d).data?.id || JSON.parse(d).id || ''); } catch(e) { console.log(''); }
  });
")
echo "  PostgreSQL credential ID: ${PG_CRED_ID:-FAILED}"

# Create Cohere HTTP Header Auth credential
COHERE_KEY="${COHERE_API_KEY:-your-cohere-api-key-here}"
echo "▸ Creating Cohere HTTP Header Auth credential..."
COHERE_CRED_RESPONSE=$(curl -s $BASIC_AUTH_HEADER -b /tmp/n8n-cookies.txt -X POST http://localhost:5678/rest/credentials \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"Cohere API\",
    \"type\": \"httpHeaderAuth\",
    \"data\": {
      \"name\": \"Authorization\",
      \"value\": \"Bearer ${COHERE_KEY}\"
    }
  }")

COHERE_CRED_ID=$(echo "$COHERE_CRED_RESPONSE" | node -e "
  let d=''; process.stdin.on('data',c=>d+=c); process.stdin.on('end',()=>{
    try { console.log(JSON.parse(d).data?.id || JSON.parse(d).id || ''); } catch(e) { console.log(''); }
  });
")
echo "  Cohere credential ID: ${COHERE_CRED_ID:-FAILED}"

# Create Groq HTTP Header Auth credential
GROQ_KEY="${GROQ_API_KEY:-your-groq-api-key-here}"
echo "▸ Creating Groq HTTP Header Auth credential..."
GROQ_CRED_RESPONSE=$(curl -s $BASIC_AUTH_HEADER -b /tmp/n8n-cookies.txt -X POST http://localhost:5678/rest/credentials \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"Groq API\",
    \"type\": \"httpHeaderAuth\",
    \"data\": {
      \"name\": \"Authorization\",
      \"value\": \"Bearer ${GROQ_KEY}\"
    }
  }")

GROQ_CRED_ID=$(echo "$GROQ_CRED_RESPONSE" | node -e "
  let d=''; process.stdin.on('data',c=>d+=c); process.stdin.on('end',()=>{
    try { console.log(JSON.parse(d).data?.id || JSON.parse(d).id || ''); } catch(e) { console.log(''); }
  });
")
echo "  Groq credential ID: ${GROQ_CRED_ID:-FAILED}"

# ── 9. Patch Workflow JSON on Disk using Python ──────────────
echo "▸ Patching workflow JSON with credential IDs..."
python3 -c "
import json, sys

pg_id = sys.argv[1]
cohere_id = sys.argv[2]
groq_id = sys.argv[3]

with open('/app/doctor_rag_workflow.json', 'r') as f:
    data = json.load(f)

for node in data.get('nodes', []):
    if 'credentials' in node:
        c = node['credentials']
        if 'postgres' in c:
            c['postgres']['id'] = pg_id
        if 'httpHeaderAuth' in c:
            name = node.get('name', '').lower()
            if 'cohere' in name:
                c['httpHeaderAuth']['id'] = cohere_id
            elif 'groq' in name:
                c['httpHeaderAuth']['id'] = groq_id

with open('/tmp/patched_workflow.json', 'w') as f:
    json.dump(data, f, indent=2)
print('✓ Workflow JSON patched successfully.')
" "$PG_CRED_ID" "$COHERE_CRED_ID" "$GROQ_CRED_ID"

# ── 10. Import Workflow via CLI ──────────────────────────────
echo "▸ Importing patched workflow via CLI..."
n8n import:workflow --input=/tmp/patched_workflow.json 2>&1 || echo "⚠ CLI import had issues"
echo "✓ Patched workflow imported."
rm -f /tmp/patched_workflow.json

# ── 11. Extract Workflow ID and versionId from SQLite ────────
python3 -c "
import sqlite3
conn = sqlite3.connect('/home/node/.n8n/database.sqlite')
cur = conn.cursor()
cur.execute('SELECT id, versionId FROM workflow_entity LIMIT 1')
row = cur.fetchone()
if row:
    print(f'WORKFLOW_INFO_OUT:{row[0]}|{row[1]}')
else:
    print('⚠ No workflow found in database!')
conn.close()
" > /tmp/import_out.txt 2>&1

cat /tmp/import_out.txt

WORKFLOW_INFO=$(grep "WORKFLOW_INFO_OUT:" /tmp/import_out.txt | cut -d':' -f2)
WORKFLOW_ID=$(echo "$WORKFLOW_INFO" | cut -d'|' -f1)
VERSION_ID=$(echo "$WORKFLOW_INFO" | cut -d'|' -f2)

if [ -n "$WORKFLOW_ID" ] && [ -n "$VERSION_ID" ]; then
  # ── 12. Save workflow ID to files for Express proxy ─────
  echo "▸ Saving workflow ID to /tmp/workflow_id.txt and /app/workflow_id.txt..."
  echo "$WORKFLOW_ID" > /tmp/workflow_id.txt
  echo "$WORKFLOW_ID" > /app/workflow_id.txt
  echo "✓ Saved ID: $WORKFLOW_ID"
  
  # ── 13. Activate workflow via REST API ──────────────────
  echo "▸ Activating workflow via REST API..."
  ACTIVATE_RESPONSE=$(curl -s $BASIC_AUTH_HEADER -b /tmp/n8n-cookies.txt -X POST "http://localhost:5678/rest/workflows/$WORKFLOW_ID/activate" \
    -H "Content-Type: application/json" \
    -d "{\"versionId\":\"$VERSION_ID\"}")
  echo "  Activation response: $ACTIVATE_RESPONSE"
else
  echo "⚠ WORKFLOW ID OR VERSION ID EXTRACTION FAILED!"
fi

rm -f /tmp/import_out.txt
# Cleanup cookies
rm -f /tmp/n8n-cookies.txt

# ── 11. Start Express Proxy ─────────────────────────────────
echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║  ✓ All services are running!                        ║"
echo "║  Frontend:   http://localhost:7860                   ║"
echo "║  n8n UI:     http://localhost:7860/n8n/              ║"
echo "║  Webhook:    http://localhost:7860/webhook/doctor-chat║"
echo "║  PostgreSQL: localhost:5432 (vitacard_db)            ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""

echo "▸ Starting Express proxy server on port 7860..."
node /app/server.js
