# Cron Jobs Configuration

This directory contains cron job endpoints for scheduled tasks.

## Jobs

### 1. Calculate DCA (`/api/cron/calculate-dca`)
- **Schedule**: End of month (e.g., 28th-31st at 23:00)
- **Purpose**: Calculate DCA recommendations for all portfolios
- **Process**:
  1. Fetch all portfolios with stocks
  2. Get stock price history from database
  3. Calculate DCA weights using algorithm
  4. Store recommendations in `dca_recommendations` table
  5. Fallback to equal DCA if insufficient data

### 2. Send LINE Notifications (`/api/cron/send-line-notifications`)
- **Schedule**: 1st of month at 08:00
- **Purpose**: Send DCA plans to users via LINE
- **Process**:
  1. Fetch all LINE profiles
  2. Get latest recommendations for each user
  3. Format message in Thai
  4. Send via LINE Messaging API

## Setup Options

### Option 1: Supabase Cron (Recommended)

Run SQL in Supabase SQL Editor:

```sql
-- Schedule DCA calculation (end of month)
SELECT cron.schedule(
  'calculate-monthly-dca',
  '0 23 28-31 * *',  -- 11 PM on days 28-31 of every month
  $$
  SELECT net.http_post(
    url := 'https://your-app.vercel.app/api/cron/calculate-dca',
    headers := jsonb_build_object(
      'Authorization', 'Bearer your-cron-secret'
    )
  );
  $$
);

-- Schedule LINE notifications (1st of month)
SELECT cron.schedule(
  'send-line-notifications',
  '0 8 1 * *',  -- 8 AM on the 1st of every month
  $$
  SELECT net.http_post(
    url := 'https://your-app.vercel.app/api/cron/send-line-notifications',
    headers := jsonb_build_object(
      'Authorization', 'Bearer your-cron-secret'
    )
  );
  $$
);
```

### Option 2: GitHub Actions

Create `.github/workflows/cron-jobs.yml`:

```yaml
name: Scheduled Cron Jobs

on:
  schedule:
    # Calculate DCA - End of month at 11 PM UTC
    - cron: '0 23 28-31 * *'
    # Send LINE - 1st of month at 8 AM UTC
    - cron: '0 8 1 * *'

jobs:
  calculate-dca:
    if: github.event.schedule == '0 23 28-31 * *'
    runs-on: ubuntu-latest
    steps:
      - name: Call Calculate DCA API
        run: |
          curl -X POST https://your-app.vercel.app/api/cron/calculate-dca \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"

  send-line:
    if: github.event.schedule == '0 8 1 * *'
    runs-on: ubuntu-latest
    steps:
      - name: Call Send LINE API
        run: |
          curl -X POST https://your-app.vercel.app/api/cron/send-line-notifications \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
```

## Environment Variables

Add to `.env.local`:

```
CRON_SECRET=your-secure-random-secret
LINE_CHANNEL_ACCESS_TOKEN=your-line-channel-token
```

## Testing

Test the cron jobs manually:

```bash
# Test DCA calculation
curl -X POST http://localhost:3000/api/cron/calculate-dca \
  -H "Authorization: Bearer your-cron-secret"

# Test LINE notifications
curl -X POST http://localhost:3000/api/cron/send-line-notifications \
  -H "Authorization: Bearer your-cron-secret"
```

## Monitoring

Check Vercel logs or Supabase logs to monitor cron job execution.
