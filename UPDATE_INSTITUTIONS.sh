#!/bin/bash

# Update Institutions Cache
# Usage: ./UPDATE_INSTITUTIONS.sh [your-token]

TOKEN=${1:-"your-token-here"}
BASE_URL="http://localhost:3000"

echo "🔄 Updating institutions cache..."
echo "📍 Endpoint: $BASE_URL/api/institutions/update"
echo "🔑 Token: $TOKEN"
echo ""

# Update institutions
curl -X POST "$BASE_URL/api/institutions/update" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -s | jq '.'

echo ""
echo "📊 Current status:"
curl -s "$BASE_URL/api/institutions/update" | jq '.' 