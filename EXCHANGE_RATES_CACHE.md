# Exchange Rates Caching System

This system provides instant access to exchange rates by caching them locally and embedding them directly into the client-side code.

## Architecture

### 1. **Client-Side Data** (`lib/exchange-rates-data.ts`)

- Contains the entire exchange rates dataset as a JavaScript object
- Provides instant access with zero network latency
- Updated via build-time script

### 2. **Server-Side Cache** (`data/exchange-rates.json`)

- JSON file containing all exchange rates
- Used as source for client-side data generation
- Updated via API endpoint

### 3. **API Endpoint** (`app/api/exchange-rates/update/route.ts`)

- `POST /api/exchange-rates/update` - Updates the cache with fresh data
- `GET /api/exchange-rates/update` - Checks current cache status
- Requires authorization token

### 4. **Server Action** (`actions/rates.ts`)

- Modified to read from cache first, fallback to API
- Maintains backward compatibility

### 5. **React Hook** (`hooks/useExchangeRate.tsx`)

- Updated to use client-side data for instant access
- No loading states or network requests

## Usage

### Update Exchange Rates Cache

```bash
# Update cache with fresh data
curl -X POST "http://localhost:3000/api/exchange-rates/update" \
  -H "Authorization: Bearer your-token-here" \
  -H "Content-Type: application/json"

# Check cache status
curl "http://localhost:3000/api/exchange-rates/update"
```

### Using the Shell Script

```bash
# Make executable
chmod +x UPDATE_EXCHANGE_RATES.sh

# Update everything (cache + client-side data)
./UPDATE_EXCHANGE_RATES.sh your-token-here
```

### In Your Code

```typescript
import { getExchangeRateClient } from "@/lib/exchange-rates-data";

// Instant access - no loading, no network requests
const rate = getExchangeRateClient("KE", "selling", "momo");
```

## Benefits

✅ **Instant Loading** - No network requests or loading states  
✅ **Zero Latency** - Data embedded directly in client code  
✅ **Offline Capable** - Works without internet connection  
✅ **Consistent Performance** - Same speed regardless of network  
✅ **Easy Updates** - Single command updates both cache and client data  

## Data Structure

```typescript
{
  "lastUpdated": "2025-01-29T00:00:00.000Z",
  "exchangeRates": {
    "NG": {
      "buying": {
        "momo": { /* exchange rate data */ },
        "bank": { /* exchange rate data */ }
      },
      "selling": {
        "momo": { /* exchange rate data */ },
        "bank": { /* exchange rate data */ }
      }
    }
    // ... other countries
  }
}
```

## Supported Countries

- **NG** - Nigeria
- **KE** - Kenya  
- **UG** - Uganda
- **GHA** - Ghana
- **ZM** - Zambia
- **TZ** - Tanzania
- **ZA** - South Africa

## Update Workflow

1. **Manual Update**: Run the shell script to fetch fresh data
2. **Cache Update**: API endpoint updates the JSON file
3. **Client Update**: Script regenerates the client-side data file
4. **Instant Access**: App uses embedded data with zero latency

This system provides the same lightning-fast experience as the institutions caching, making your app feel incredibly responsive! 🚀
