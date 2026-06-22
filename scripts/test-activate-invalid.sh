LOGIN_RESPONSE=$(curl -s -c /tmp/n8n-test-cookies5.txt -X POST http://localhost:5679/rest/login \
  -H "Content-Type: application/json" \
  -d '{
    "emailOrLdapLoginId": "admin@vitacard.ai",
    "password": "VitaCard2026!"
  }')

CREATE_WF=$(curl -s -b /tmp/n8n-test-cookies5.txt -X POST http://localhost:5679/rest/workflows \
  -H "Content-Type: application/json" \
  -d '{
  "name": "Test Webhook Invalid",
  "nodes": [
    {
      "parameters": {
        "httpMethod": "POST",
        "path": "test-chat",
        "responseMode": "lastNode"
      },
      "id": "webhook1",
      "name": "Webhook",
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 1,
      "position": [250, 300]
    },
    {
      "parameters": {},
      "id": "postgres1",
      "name": "Postgres",
      "type": "n8n-nodes-base.postgres",
      "typeVersion": 2.5,
      "position": [450, 300],
      "credentials": {
        "postgres": {
          "id": "invalid-cred-id",
          "name": "Postgres"
        }
      }
    }
  ],
  "connections": {
    "Webhook": {
      "main": [
        [
          {
            "node": "Postgres",
            "type": "main",
            "index": 0
          }
        ]
      ]
    }
  }
}')

WF_INFO=$(echo "$CREATE_WF" | node -e "
let d=''; process.stdin.on('data',c=>d+=c); process.stdin.on('end',()=>{
  try {
    const parsed = JSON.parse(d);
    const data = parsed.data || parsed;
    console.log(data.id + '|' + data.versionId);
  } catch(e) {}
});
")
WF_ID=$(echo "$WF_INFO" | cut -d'|' -f1)
VERSION_ID=$(echo "$WF_INFO" | cut -d'|' -f2)

ACTIVATE_RESPONSE=$(curl -i -s -b /tmp/n8n-test-cookies5.txt -X POST "http://localhost:5679/rest/workflows/$WF_ID/activate" \
  -H "Content-Type: application/json" \
  -d "{\"versionId\":\"$VERSION_ID\"}")

echo "Activation response: $ACTIVATE_RESPONSE"
