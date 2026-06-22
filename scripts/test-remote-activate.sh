WF_ID="m09iEL7myuIFmbHv"
VERSION_ID="d5f3adcd-aaae-4d72-a661-1e96fcd73f34"

ACTIVATE_RESPONSE=$(curl -i -s -b /tmp/n8n-remote-cookies.txt -X POST "https://satishverma0870-vitacard-healthcare.hf.space/n8n/rest/workflows/$WF_ID/activate" \
  -H "Content-Type: application/json" \
  -d "{\"versionId\":\"$VERSION_ID\"}")

echo "Activation response: $ACTIVATE_RESPONSE"
