#!/bin/bash

# Update All Caches Script
# Updates both institutions and exchange rates caches

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if token is provided
if [ $# -eq 0 ]; then
    echo -e "${RED}Error: Please provide your authorization token${NC}"
    echo "Usage: ./UPDATE_ALL_CACHES.sh <your-token>"
    echo "Example: ./UPDATE_ALL_CACHES.sh RMPSEC-your-token-here"
    exit 1
fi

TOKEN=$1
BASE_URL="http://localhost:3000"

echo -e "${BLUE}🔄 Starting cache update process...${NC}"
echo ""

# Function to check if server is running
check_server() {
    if ! curl -s "$BASE_URL" > /dev/null; then
        echo -e "${RED}❌ Error: Server is not running on $BASE_URL${NC}"
        echo "Please start your Next.js development server first:"
        echo "  bun run dev"
        exit 1
    fi
}

# Function to update institutions cache
update_institutions() {
    echo -e "${YELLOW}📊 Updating institutions cache...${NC}"
    
    RESPONSE=$(curl -s -X POST "$BASE_URL/api/institutions/update" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json")
    
           if echo "$RESPONSE" | grep -q '"success":true'; then
           echo -e "${GREEN}✅ Institutions cache updated successfully${NC}"
           if command -v jq >/dev/null 2>&1; then
               echo "$RESPONSE" | jq -r '"Last Updated: " + .lastUpdated'
               echo "$RESPONSE" | jq -r '"Countries Updated: " + (.countriesUpdated | tostring)'
               echo "$RESPONSE" | jq -r '"Total Institutions: " + (.totalInstitutions | tostring)'
               echo -e "${BLUE}📝 Client-side data file regenerated${NC}"
           else
               echo "$RESPONSE"
           fi
           else
               echo -e "${RED}❌ Failed to update institutions cache${NC}"
               echo "$RESPONSE"
               exit 1
           fi
}

# Function to update exchange rates cache
update_exchange_rates() {
    echo -e "${YELLOW}💱 Updating exchange rates cache...${NC}"
    
    RESPONSE=$(curl -s -X POST "$BASE_URL/api/exchange-rates/update" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json")
    
    if echo "$RESPONSE" | grep -q '"success":true'; then
        echo -e "${GREEN}✅ Exchange rates cache updated successfully${NC}"
        if command -v jq >/dev/null 2>&1; then
            echo "$RESPONSE" | jq -r '"Last Updated: " + .lastUpdated'
            echo "$RESPONSE" | jq -r '"Countries Updated: " + (.countriesUpdated | tostring)'
            echo "$RESPONSE" | jq -r '"Total Rates: " + (.totalRates | tostring)'
        else
            echo "$RESPONSE"
        fi
        
        # Regenerate client-side TypeScript file
        echo -e "${BLUE}🔄 Regenerating client-side data file...${NC}"
        node << 'EOF'
const fs = require('fs');
const data = JSON.parse(fs.readFileSync('data/exchange-rates.json', 'utf8'));

// Read existing file to preserve additional code
let existingContent = '';
try {
  existingContent = fs.readFileSync('lib/exchange-rates-data.ts', 'utf8');
} catch {
  // File doesn't exist yet, that's fine
}

// Extract the additional code that should be preserved
const additionalCodeMatch = existingContent.match(/\/\/ Fixed cross rates:[\s\S]*$/);
const additionalCode = additionalCodeMatch ? additionalCodeMatch[0] : `// Fixed cross rates: 1 NGN -> Local currency units
export const NGN_TO_LOCAL_RATES = {
  UG: 2.319,
  KE: 0.08645,
  TZ: 1.655,
  GHA: 0.008266,
};

export function getNgnToLocalRate(country) {
  return NGN_TO_LOCAL_RATES[country];
}

// Instant client-side exchange rate getter
export function getExchangeRateClient(
  country,
  orderType = "selling",
  providerType = "momo"
) {
  if (!country) return null;
  
  const countryRates = exchangeRatesData.exchangeRates[country];
  if (countryRates && countryRates[orderType] && countryRates[orderType][providerType]) {
    return countryRates[orderType][providerType];
  }
  
  return null;
}`;

const content = `// Client-side exchange rates data for instant access
export const exchangeRatesData = ${JSON.stringify(data, null, 2)};

${additionalCode}
`;
fs.writeFileSync('lib/exchange-rates-data.ts', content);
console.log('✅ Client-side exchange rates data regenerated');
EOF
        
    else
        echo -e "${RED}❌ Failed to update exchange rates cache${NC}"
        echo "$RESPONSE"
        exit 1
    fi
}

# Function to show cache status
show_status() {
    echo -e "${BLUE}📋 Current cache status:${NC}"
    echo ""
    
    echo -e "${YELLOW}🏦 Institutions Cache:${NC}"
    INST_RESPONSE=$(curl -s "$BASE_URL/api/institutions/update")
    if echo "$INST_RESPONSE" | grep -q '"success":true'; then
        if command -v jq >/dev/null 2>&1; then
            echo "$INST_RESPONSE" | jq -r '"Last Updated: " + .lastUpdated'
            echo "$INST_RESPONSE" | jq -r '"Countries: " + (.countries | join(", "))'
            echo "$INST_RESPONSE" | jq -r '"Total Institutions: " + (.totalInstitutions | tostring)'
        else
            echo "$INST_RESPONSE"
        fi
    else
        echo -e "${RED}❌ Error fetching institutions status${NC}"
    fi
    
    echo ""
    echo -e "${YELLOW}💱 Exchange Rates Cache:${NC}"
    RATES_RESPONSE=$(curl -s "$BASE_URL/api/exchange-rates/update")
    if echo "$RATES_RESPONSE" | grep -q '"success":true'; then
        if command -v jq >/dev/null 2>&1; then
            echo "$RATES_RESPONSE" | jq -r '"Last Updated: " + .lastUpdated'
            echo "$RATES_RESPONSE" | jq -r '"Countries: " + (.countries | join(", "))'
            echo "$RATES_RESPONSE" | jq -r '"Total Rates: " + (.totalRates | tostring)'
        else
            echo "$RATES_RESPONSE"
        fi
    else
        echo -e "${RED}❌ Error fetching exchange rates status${NC}"
    fi
}

# Main execution
echo -e "${BLUE}🚀 Cache Update Script${NC}"
echo "================================"
echo ""

# Check if server is running
check_server

# Update both caches
update_institutions
echo ""
update_exchange_rates
echo ""

# Show final status
echo -e "${GREEN}🎉 All caches updated successfully!${NC}"
echo ""
show_status

echo ""
echo -e "${GREEN}✨ Your app now has instant loading for both institutions and exchange rates!${NC}" 