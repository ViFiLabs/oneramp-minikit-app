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

// Read existing file to preserve additional code
let existingContent = '';
try {
  existingContent = fs.readFileSync('lib/exchange-rates-data.ts', 'utf8');
} catch {
  // File doesn't exist yet, that's fine
}

// Extract the additional code that should be preserved
const additionalCodeMatch = existingContent.match(/\/\/ Fixed cross rates:[\s\S]*$/);
const additionalCode = additionalCodeMatch ? additionalCodeMatch[0] : \`// Fixed cross rates: 1 NGN -> Local currency units
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
  orderType = \"selling\",
  providerType = \"momo\"
) {
  if (!country) return null;
  
  const countryRates = exchangeRatesData.exchangeRates[country];
  if (countryRates && countryRates[orderType] && countryRates[orderType][providerType]) {
    return countryRates[orderType][providerType];
  }
  
  return null;
}\`;

const content = \`// Client-side exchange rates data for instant access
export const exchangeRatesData = \${JSON.stringify(data, null, 2)};

\${additionalCode}
\`;
fs.writeFileSync('lib/exchange-rates-data.ts', content);
console.log('✅ Updated client-side exchange rates data');
" 