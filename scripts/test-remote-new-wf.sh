CREATE_WF=$(curl -s -b /tmp/n8n-remote-cookies.txt -X POST https://satishverma0870-vitacard-healthcare.hf.space/n8n/rest/workflows \
  -H "Content-Type: application/json" \
  -d '{
  "name": "Test Simple Webhook",
  "nodes": [
    {
      "parameters": {
        "httpMethod": "POST",
        "path": "test-chat",
        "responseMode": "onReceived",
        "options": {}
      },
      "id": "webhook-test",
      "name": "Webhook",
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 1,
      "position": [250, 300]
    }
  ],
  "connections": {}
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

curl -s -b /tmp/n8n-remote-cookies.txt -X POST "https://satishverma0870-vitacard-healthcare.hf.space/n8n/rest/workflows/$WF_ID/activate" \
  -H "Content-Type: application/json" \
  -d "{\"versionId\":\"$VERSION_ID\"}" > /dev/null

echo "Activated test workflow $WF_ID"
