# Supabase Setup Instructions

This directory contains database migrations for the DCA Investment System.

## Prerequisites

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Get your project credentials:
   - Project URL
   - Anon/Public key
   - Service role key (for server-side operations)

## Environment Setup

1. Copy `.env.local.example` to `.env.local`
2. Fill in your Supabase credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

## Running Migrations

### Option 1: Using Supabase CLI (Recommended)

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Run migrations
supabase db push
```

### Option 2: Using Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of each migration file in order:
   - `001_initial_schema.sql`
   - `002_rls_policies.sql`
4. Execute each SQL script

## Database Schema

### Tables

- **users**: User profiles (synced with Supabase Auth)
- **portfolios**: User investment portfolios
- **portfolio_stocks**: Stocks within each portfolio
- **stock_prices**: Historical stock price data
- **dca_recommendations**: Monthly DCA recommendations
- **line_profiles**: LINE user ID mappings for notifications

### Row Level Security (RLS)

All tables have RLS enabled. Users can only access their own data:
- Portfolios, stocks, and recommendations are scoped to the user
- Stock prices are publicly readable for all authenticated users
- Service role can bypass RLS for cron jobs

## Testing

After running migrations, test the database by:
1. Creating a user through the signup flow
2. Verifying the user can create portfolios
3. Testing that users cannot access other users' data
