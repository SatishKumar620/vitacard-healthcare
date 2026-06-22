LOGIN_RESPONSE=$(curl -s -c /tmp/n8n-remote-cookies2.txt -X POST https://satishverma0870-vitacard-healthcare.hf.space/n8n/rest/login \
  -H "Content-Type: application/json" \
  -d '{
    "emailOrLdapLoginId": "admin@vitacard.ai",
    "password": "VitaCard2026!"
  }')

curl -s -b /tmp/n8n-remote-cookies2.txt https://satishverma0870-vitacard-healthcare.hf.space/n8n/rest/workflows
