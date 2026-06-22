#!/bin/bash
# Remote setup script - run via debug-exec endpoint
set -e

# Login
echo "=== LOGGING IN ==="
curl -s -c /tmp/dc.txt -X POST http://localhost:5678/rest/login \
  -H "Content-Type: application/json" \
  -d '{"emailOrLdapLoginId":"admin@vitacard.ai","password":"VitaCard2026!"}' > /dev/null

# Create PostgreSQL credential
echo "=== CREATING PG CREDENTIAL ==="
PG_RESP=$(curl -s -b /tmp/dc.txt -X POST http://localhost:5678/rest/credentials \
  -H "Content-Type: application/json" \
  -d '{"name":"PostgreSQL","type":"postgres","data":{"host":"/var/run/postgresql","port":5432,"database":"vitacard_db","user":"vitacard","password":"","ssl":"disable"}}')
PG_ID=$(echo "$PG_RESP" | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{try{const p=JSON.parse(d);console.log(p.data?.id||p.id||'')}catch(e){console.log('')}});")
echo "PG_ID=$PG_ID"

# Create Cohere credential
echo "=== CREATING COHERE CREDENTIAL ==="
COHERE_KEY="${COHERE_API_KEY:-your-cohere-api-key-here}"
COHERE_RESP=$(curl -s -b /tmp/dc.txt -X POST http://localhost:5678/rest/credentials \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Cohere API\",\"type\":\"httpHeaderAuth\",\"data\":{\"name\":\"Authorization\",\"value\":\"Bearer ${COHERE_KEY}\"}}")
COHERE_ID=$(echo "$COHERE_RESP" | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{try{const p=JSON.parse(d);console.log(p.data?.id||p.id||'')}catch(e){console.log('')}});")
echo "COHERE_ID=$COHERE_ID"

# Create Groq credential
echo "=== CREATING GROQ CREDENTIAL ==="
GROQ_KEY="${GROQ_API_KEY:-your-groq-api-key-here}"
GROQ_RESP=$(curl -s -b /tmp/dc.txt -X POST http://localhost:5678/rest/credentials \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Groq API\",\"type\":\"httpHeaderAuth\",\"data\":{\"name\":\"Authorization\",\"value\":\"Bearer ${GROQ_KEY}\"}}")
GROQ_ID=$(echo "$GROQ_RESP" | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{try{const p=JSON.parse(d);console.log(p.data?.id||p.id||'')}catch(e){console.log('')}});")
echo "GROQ_ID=$GROQ_ID"

# Get workflow ID and versionId
echo "=== GETTING WORKFLOW ==="
WF_LIST=$(curl -s -b /tmp/dc.txt http://localhost:5678/rest/workflows)
WF_INFO=$(echo "$WF_LIST" | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{try{const p=JSON.parse(d);const w=(p.data||p);if(Array.isArray(w)&&w.length>0){console.log(w[0].id+'|'+w[0].versionId)}else{console.log('')}}catch(e){console.log('')}});")
WF_ID=$(echo "$WF_INFO" | cut -d'|' -f1)
VER_ID=$(echo "$WF_INFO" | cut -d'|' -f2)
echo "WF_ID=$WF_ID VER_ID=$VER_ID"

if [ -z "$WF_ID" ]; then
  echo "ERROR: No workflow found"
  exit 1
fi

# Fetch full workflow
echo "=== FETCHING FULL WORKFLOW ==="
FULL_WF=$(curl -s -b /tmp/dc.txt "http://localhost:5678/rest/workflows/${WF_ID}")

# Patch credentials and set active=true
echo "=== PATCHING WORKFLOW ==="
PATCHED=$(echo "$FULL_WF" | node -e "
let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{
  try{
    const wf=JSON.parse(d);
    const data=wf.data||wf;
    if(data.nodes){
      data.nodes.forEach(n=>{
        if(n.credentials){
          if(n.credentials.postgres){
            n.credentials.postgres.id='${PG_ID}';
          }
          if(n.credentials.httpHeaderAuth){
            const nId=(n.id||'').toLowerCase();
            const nName=(n.name||'').toLowerCase();
            if(nId.includes('groq')||nName.includes('groq')){
              n.credentials.httpHeaderAuth.id='${GROQ_ID}';
            }else if(nId.includes('cohere')||nName.includes('cohere')){
              n.credentials.httpHeaderAuth.id='${COHERE_ID}';
            }
          }
        }
      });
    }
    data.active=true;
    console.log(JSON.stringify(data));
  }catch(e){
    process.stderr.write('Patch error: '+e.message);
    console.log(d);
  }
});
")

# PUT updated workflow
echo "=== UPDATING WORKFLOW ==="
UPDATE_RESP=$(curl -s -b /tmp/dc.txt -X PUT \
  "http://localhost:5678/rest/workflows/${WF_ID}" \
  -H "Content-Type: application/json" \
  -d "$PATCHED")
echo "UPDATE first 200 chars: $(echo "$UPDATE_RESP" | head -c 200)"

# Get new versionId
NEW_VER=$(echo "$UPDATE_RESP" | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{try{const p=JSON.parse(d);console.log((p.data||p).versionId||'')}catch(e){console.log('')}});")
echo "NEW_VER=$NEW_VER"

if [ -z "$NEW_VER" ]; then
  NEW_VER="$VER_ID"
fi

# Activate workflow
echo "=== ACTIVATING WORKFLOW ==="
ACT_RESP=$(curl -s -b /tmp/dc.txt -X POST \
  "http://localhost:5678/rest/workflows/${WF_ID}/activate" \
  -H "Content-Type: application/json" \
  -d "{\"versionId\":\"${NEW_VER}\"}")
echo "ACTIVATE first 300 chars: $(echo "$ACT_RESP" | head -c 300)"

# Wait and test webhook
sleep 3
echo "=== TESTING WEBHOOK ==="
TEST=$(curl -s -X POST http://localhost:5678/webhook/doctor-chat \
  -H "Content-Type: application/json" \
  -d '{"message":"test"}')
echo "WEBHOOK TEST: $(echo "$TEST" | head -c 300)"

echo "=== DONE ==="
