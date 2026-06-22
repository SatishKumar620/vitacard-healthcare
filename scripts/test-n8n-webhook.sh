LOGIN_RESPONSE=$(curl -s -c /tmp/n8n-test-cookies3.txt -X POST http://localhost:5679/rest/login \
  -H "Content-Type: application/json" \
  -d '{
    "emailOrLdapLoginId": "admin@vitacard.ai",
    "password": "VitaCard2026!"
  }')

echo "Creating workflow..."
CREATE_WF=$(curl -s -b /tmp/n8n-test-cookies3.txt -X POST http://localhost:5679/rest/workflows \
  -H "Content-Type: application/json" \
  -d '{
  "name": "Test Webhook",
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
    }
  ],
  "connections": {},
  "active": true
}')

echo "$CREATE_WF"
