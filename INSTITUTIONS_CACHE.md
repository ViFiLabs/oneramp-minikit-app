# Institutions Caching System

This system provides fast loading of institutions data by caching it in a JSON file, eliminating the 5-8 second API calls.

## How It Works

1. **Fast Loading**: Institutions are loaded from `data/institutions.json` first (instant)
2. **Fallback**: If the JSON file doesn't exist or is missing data, it falls back to the API
3. **Manual Updates**: Use the API endpoint to update the cache when needed

## Files

- `data/institutions.json` - Cached institutions data
- `app/api/institutions/update/route.ts` - API endpoint to update cache
- `actions/institutions.ts` - Updated to read from cache first
- `scripts/update-institutions.js` - Helper script for updating

## Usage

### 1. Check Current Status

```bash
# Check what's currently cached
node scripts/update-institutions.js check
```

### 2. Update Institutions Cache

```bash
# Update all institutions (replace 'your-token' with actual token)
node scripts/update-institutions.js your-token

# Or use curl
curl -X POST http://localhost:3000/api/institutions/update \
  -H "Authorization: Bearer your-token" \
  -H "Content-Type: application/json"
```

### 3. Check API Status

```bash
# Get current cache status
curl http://localhost:3000/api/institutions/update
```

## Performance Improvement

**Before**: 5-8 seconds for first load
**After**: Instant loading from cache

## Security

The update endpoint requires authorization. You can customize the token validation in `app/api/institutions/update/route.ts`:

```typescript
// Uncomment and set your token
// if (token !== process.env.ADMIN_TOKEN) {
//   return NextResponse.json({ error: "Invalid token" }, { status: 401 });
// }
```

## Automatic Fallback

If the cache is missing or corrupted, the system automatically falls back to the API, ensuring the app always works.

## Monitoring

The system logs all operations:

- ✅ Cache hits
- ⚠️ Cache misses (falling back to API)
- 🔄 API calls
- ❌ Errors

## Maintenance

- Update the cache weekly or when institutions change
- Monitor the logs for any issues
- The cache includes a `lastUpdated` timestamp for tracking
