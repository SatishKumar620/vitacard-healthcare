LOGIN_RESPONSE=$(curl -s -c /tmp/n8n-test-cookies4.txt -X POST http://localhost:5679/rest/login \
  -H "Content-Type: application/json" \
  -d '{
    "emailOrLdapLoginId": "admin@vitacard.ai",
    "password": "VitaCard2026!"
  }')

CREATE_WF=$(curl -s -b /tmp/n8n-test-cookies4.txt -X POST http://localhost:5679/rest/workflows \
  -H "Content-Type: application/json" \
  -d '{
  "name": "Test Webhook 2",
  "nodes": [],
  "connections": {}
}')
WF_ID=$(echo "$CREATE_WF" | grep -oP '"id":"\K[^"]+')
VERSION_ID=$(echo "$CREATE_WF" | grep -oP '"versionId":"\K[^"]+')

echo "Activating workflow $WF_ID version $VERSION_ID"

ACTIVATE_RESPONSE=$(curl -i -s -b /tmp/n8n-test-cookies4.txt -X POST "http://localhost:5679/rest/workflows/$WF_ID/activate" \
  -H "Content-Type: application/json" \
  -d "{\"versionId\":\"$VERSION_ID\"}")

echo "Activation response: $ACTIVATE_RESPONSE"
