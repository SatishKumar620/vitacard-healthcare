#!/bin/bash
set -e
set -x

# Load env variables from container
export N8N_BASIC_AUTH_USER=$(env | grep N8N_BASIC_AUTH_USER | cut -d'=' -f2)
export N8N_BASIC_AUTH_PASSWORD=$(env | grep N8N_BASIC_AUTH_PASSWORD | cut -d'=' -f2)
export COHERE_API_KEY=$(env | grep COHERE_API_KEY | cut -d'=' -f2)
export GROQ_API_KEY=$(env | grep GROQ_API_KEY | cut -d'=' -f2)

if [ -z "$N8N_BASIC_AUTH_USER" ] || [ -z "$N8N_BASIC_AUTH_PASSWORD" ]; then
  echo "Error: N8N basic auth credentials not found in env!"
  exit 1
fi

echo "Using user: $N8N_BASIC_AUTH_USER"

# Build auth header
AUTH_HEADER="-u $N8N_BASIC_AUTH_USER:$N8N_BASIC_AUTH_PASSWORD"

# 1. Setup owner if not done
echo "▸ Setting up owner account..."
SETUP_RESP=$(curl -s $AUTH_HEADER -X POST http://localhost:5678/rest/owner/setup \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$N8N_BASIC_AUTH_USER\",
    \"firstName\": \"VitaCard\",
    \"lastName\": \"Admin\",
    \"password\": \"$N8N_BASIC_AUTH_PASSWORD\"
  }" || echo "Setup already done or failed")
echo "Setup Response: $SETUP_RESP"

# 2. Login
echo "▸ Logging in..."
LOGIN_RESP=$(curl -s $AUTH_HEADER -c /tmp/n8n-cookies.txt -X POST http://localhost:5678/rest/login \
  -H "Content-Type: application/json" \
  -d "{
    \"emailOrLdapLoginId\": \"$N8N_BASIC_AUTH_USER\",
    \"password\": \"$N8N_BASIC_AUTH_PASSWORD\"
  }")
echo "Login Response: $LOGIN_RESP"

# 3. Create PG Credentials
echo "▸ Creating PostgreSQL credentials..."
PG_RESP=$(curl -s $AUTH_HEADER -b /tmp/n8n-cookies.txt -X POST http://localhost:5678/rest/credentials \
  -H "Content-Type: application/json" \
  -d '{
    "name": "PostgreSQL",
    "type": "postgres",
    "data": {
      "host": "/var/run/postgresql",
      "port": 5432,
      "database": "vitacard_db",
      "user": "vitacard",
      "password": "",
      "ssl": "disable"
    }
  }')
echo "PG Resp: $PG_RESP"
PG_ID=$(echo "$PG_RESP" | node -e "
  let d=''; process.stdin.on('data',c=>d+=c); process.stdin.on('end',()=>{
    try { console.log(JSON.parse(d).data?.id || JSON.parse(d).id || ''); } catch(e) { console.log(''); }
  });
")
echo "PG Credential ID: $PG_ID"

# 4. Create Cohere Credentials
echo "▸ Creating Cohere credentials..."
COHERE_RESP=$(curl -s $AUTH_HEADER -b /tmp/n8n-cookies.txt -X POST http://localhost:5678/rest/credentials \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"Cohere API\",
    \"type\": \"httpHeaderAuth\",
    \"data\": {
      \"name\": \"Authorization\",
      \"value\": \"Bearer $COHERE_API_KEY\"
    }
  }")
echo "Cohere Resp: $COHERE_RESP"
COHERE_ID=$(echo "$COHERE_RESP" | node -e "
  let d=''; process.stdin.on('data',c=>d+=c); process.stdin.on('end',()=>{
    try { console.log(JSON.parse(d).data?.id || JSON.parse(d).id || ''); } catch(e) { console.log(''); }
  });
")
echo "Cohere Credential ID: $COHERE_ID"

# 5. Create Groq Credentials
echo "▸ Creating Groq credentials..."
GROQ_RESP=$(curl -s $AUTH_HEADER -b /tmp/n8n-cookies.txt -X POST http://localhost:5678/rest/credentials \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"Groq API\",
    \"type\": \"httpHeaderAuth\",
    \"data\": {
      \"name\": \"Authorization\",
      \"value\": \"Bearer $GROQ_API_KEY\"
    }
  }")
echo "Groq Resp: $GROQ_RESP"
GROQ_ID=$(echo "$GROQ_RESP" | node -e "
  let d=''; process.stdin.on('data',c=>d+=c); process.stdin.on('end',()=>{
    try { console.log(JSON.parse(d).data?.id || JSON.parse(d).id || ''); } catch(e) { console.log(''); }
  });
")
echo "Groq Credential ID: $GROQ_ID"

# 6. Retrieve Workflow Info
echo "▸ Retrieving workflows..."
WF_JSON=$(curl -s $AUTH_HEADER -b /tmp/n8n-cookies.txt http://localhost:5678/rest/workflows)
echo "WF JSON: $WF_JSON"

WF_INFO=$(echo "$WF_JSON" | node -e "
  let d=''; process.stdin.on('data',c=>d+=c); process.stdin.on('end',()=>{
    try {
      const parsed = JSON.parse(d);
      const wfs = parsed.data || parsed;
      if (Array.isArray(wfs) && wfs.length > 0) { console.log(wfs[0].id + '|' + wfs[0].versionId); }
      else { console.log(''); }
    } catch(e) { console.log(''); }
  });
")
WF_ID=$(echo "$WF_INFO" | cut -d'|' -f1)
WF_VER=$(echo "$WF_INFO" | cut -d'|' -f2)
echo "Workflow ID: $WF_ID (Version: $WF_VER)"

if [ -z "$WF_ID" ]; then
  echo "Error: Workflow not found!"
  exit 1
fi

# 7. Get full workflow JSON
FULL_WF=$(curl -s $AUTH_HEADER -b /tmp/n8n-cookies.txt "http://localhost:5678/rest/workflows/$WF_ID")

# 8. Patch workflow with credential IDs
PATCHED_WF=$(echo "$FULL_WF" | node -e "
  let d=''; process.stdin.on('data',c=>d+=c); process.stdin.on('end',()=>{
    try {
      const wf = JSON.parse(d);
      const data = wf.data || wf;
      if (data.nodes) {
        data.nodes.forEach(n => {
          if (n.credentials) {
            if (n.credentials.postgres) {
              n.credentials.postgres.id = '$PG_ID';
            }
            if (n.credentials.httpHeaderAuth) {
              const nId = (n.id || '').toLowerCase();
              const nName = (n.name || '').toLowerCase();
              if (nId.includes('groq') || nName.includes('groq')) {
                n.credentials.httpHeaderAuth.id = '$GROQ_ID';
              } else if (nId.includes('cohere') || nName.includes('cohere')) {
                n.credentials.httpHeaderAuth.id = '$COHERE_ID';
              }
            }
          }
        });
      }
      data.active = true;
      console.log(JSON.stringify(data));
    } catch(e) {
      process.stderr.write('Patch error: ' + e.message + '\n');
      console.log(d);
    }
  });
")

# 9. Update workflow
echo "▸ Updating workflow..."
UPDATE_RESP=$(curl -s $AUTH_HEADER -b /tmp/n8n-cookies.txt -X PUT \
  "http://localhost:5678/rest/workflows/$WF_ID" \
  -H "Content-Type: application/json" \
  -d "$PATCHED_WF")
echo "Update response: $UPDATE_RESP"

NEW_VER=$(echo "$UPDATE_RESP" | node -e "
  let d=''; process.stdin.on('data',c=>d+=c); process.stdin.on('end',()=>{
    try {
      const parsed = JSON.parse(d);
      const data = parsed.data || parsed;
      console.log(data.versionId || '');
    } catch(e) { console.log(''); }
  });
")
if [ -z "$NEW_VER" ]; then
  NEW_VER="$WF_VER"
fi
echo "New versionId: $NEW_VER"

# 10. Activate workflow
echo "▸ Activating workflow..."
ACTIVATE_RESP=$(curl -s $AUTH_HEADER -b /tmp/n8n-cookies.txt -X POST \
  "http://localhost:5678/rest/workflows/$WF_ID/activate" \
  -H "Content-Type: application/json" \
  -d "{\"versionId\":\"$NEW_VER\"}")
echo "Activation Response: $ACTIVATE_RESP"

# Cleanup cookies
rm -f /tmp/n8n-cookies.txt

echo "Setup completed successfully!"
