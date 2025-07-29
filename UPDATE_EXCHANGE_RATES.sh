#!/bin/bash
TOKEN=${1:-"your-token-here"}
BASE_URL="http://localhost:3000"

echo "🔄 Updating exchange rates cache..."
curl -X POST "$BASE_URL/api/exchange-rates/update" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -s | jq '.'

echo ""
echo "📊 Current status:"
curl -s "$BASE_URL/api/exchange-rates/update" | jq '.'

echo ""
echo "🔄 Updating client-side data..."
node -e "
const fs = require('fs');
const data = JSON.parse(fs.readFileSync('data/exchange-rates.json', 'utf8'));
const content = \`// Client-side exchange rates data for instant access
export const exchangeRatesData = \${JSON.stringify(data, null, 2)};

// Instant client-side exchange rate getter
export function getExchangeRateClient(
  country: string,
  orderType: \"buying\" | \"selling\" = \"selling\",
  providerType: \"momo\" | \"bank\" = \"momo\"
) {
  if (!country) return null;
  
  const countryRates = exchangeRatesData.exchangeRates[country];
  if (countryRates && countryRates[orderType] && countryRates[orderType][providerType]) {
    return countryRates[orderType][providerType];
  }
  
  return null;
}
\`;
fs.writeFileSync('lib/exchange-rates-data.ts', content);
console.log('✅ Updated client-side exchange rates data');
" 