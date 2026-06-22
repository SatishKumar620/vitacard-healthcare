# Create n8n owner account (required for API access)
N8N_SETUP_RESPONSE=$(curl -s -X POST http://localhost:5679/rest/owner/setup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@vitacard.ai",
    "firstName": "VitaCard",
    "lastName": "Admin",
    "password": "VitaCard2026!"
  }' 2>/dev/null || echo '{}')

echo "Owner setup: $N8N_SETUP_RESPONSE"

# Login to get auth cookie
LOGIN_RESPONSE=$(curl -s -c /tmp/n8n-test-cookies.txt -X POST http://localhost:5679/rest/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@vitacard.ai",
    "password": "VitaCard2026!"
  }')

echo "Login: $LOGIN_RESPONSE"

COHERE_KEY="your-cohere-api-key-here"
echo "Creating Cohere HTTP Header Auth credential..."
COHERE_CRED_RESPONSE=$(curl -s -b /tmp/n8n-test-cookies.txt -X POST http://localhost:5679/rest/credentials \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"Cohere API\",
    \"type\": \"httpHeaderAuth\",
    \"data\": {
      \"name\": \"Authorization\",
      \"value\": \"Bearer ${COHERE_KEY}\"
    }
  }")
echo "Cohere Cred Response: $COHERE_CRED_RESPONSE"
