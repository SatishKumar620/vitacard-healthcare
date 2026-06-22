LOGIN_RESPONSE=$(curl -s -c /tmp/n8n-remote-cookies.txt -X POST https://satishverma0870-vitacard-healthcare.hf.space/n8n/rest/login \
  -H "Content-Type: application/json" \
  -d '{
    "emailOrLdapLoginId": "admin@vitacard.ai",
    "password": "VitaCard2026!"
  }')

echo "Login: $LOGIN_RESPONSE"

curl -s -b /tmp/n8n-remote-cookies.txt https://satishverma0870-vitacard-healthcare.hf.space/n8n/rest/workflows
