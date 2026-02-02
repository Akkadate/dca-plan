# DCA Investment System

A production-ready web application for long-term DCA (Dollar Cost Averaging) investors built with Next.js, Supabase, and LINE integration.

## Features

- 🔐 **Multi-user Authentication** - Supabase Auth with email/password
- 💼 **Portfolio Management** - Create and manage multiple investment portfolios
- 📊 **Smart DCA Weighting** - Intelligent algorithm using MA6, portfolio drift, and volatility
- 📈 **Stock Price Tracking** - Automatic price fetching and caching
- 📱 **LINE Notifications** - Monthly DCA plans sent via LINE on the 1st
- 📜 **History Tracking** - View past recommendations with reasons
- 🌙 **Dark Mode** - Beautiful UI with dark mode support

## Tech Stack

- **Frontend**: Next.js 15 (App Router), TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Server Actions
- **Database**: Supabase (PostgreSQL with Row Level Security)
- **Authentication**: Supabase Auth
- **Notifications**: LINE Messaging API
- **Stock Prices**: Alpha Vantage / Finnhub API
- **Scheduling**: Supabase Cron or GitHub Actions

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account
- LINE Developer account (for notifications)
- Stock price API key (Alpha Vantage or Finnhub)

### Installation

1. **Clone the repository**
   ```bash
   cd dca-plan-app
   npm install
   ```

2. **Set up environment variables**
   ```bash
   cp .env.local.example .env.local
   ```
   
   Fill in your credentials in `.env.local`:
   - Get Supabase credentials from [supabase.com](https://supabase.com)
   - Get LINE token from [LINE Developers](https://developers.line.biz/)
   - Get stock API key from [Alpha Vantage](https://www.alphavantage.co/) or [Finnhub](https://finnhub.io/)

3. **Set up database**
   
   Run the migrations in Supabase SQL Editor:
   ```bash
   # See supabase/README.md for detailed instructions
   ```

4. **Run development server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
dca-plan-app/
├── app/                      # Next.js app router
│   ├── api/                 # API routes
│   │   ├── auth/           # Authentication
│   │   ├── cron/           # Scheduled jobs
│   │   └── prices/         # Stock price fetching
│   ├── dashboard/          # Main dashboard
│   ├── portfolio/          # Portfolio management
│   ├── history/            # Recommendation history
│   ├── login/              # Login page
│   └── signup/             # Signup page
├── components/             # React components
├── lib/                    # Utilities and helpers
│   ├── dca/               # DCA algorithm
│   ├── supabase/          # Supabase clients
│   ├── types/             # TypeScript types
│   └── stockApi.ts        # Stock price API
├── supabase/              # Database migrations
└── middleware.ts          # Auth middleware
```

## DCA Algorithm

The system uses a 7-step algorithm to calculate monthly investment amounts:

1. **Base Weight**: Start with target weight
2. **Price Deviation**: Adjust based on MA6 comparison
3. **Portfolio Drift**: Adjust based on actual vs target weight
4. **Volatility Guard**: Reduce if volatility is high
5. **Clamp**: Keep within min/max bounds
6. **Normalize**: Ensure weights sum to 100%
7. **Convert to USD**: Apply to monthly budget

**Key Constraints**:
- Every stock receives allocation monthly (no $0)
- Fallback to equal DCA if data is insufficient
- Thai language reason text for each recommendation

## Deployment

### Deploy to Vercel

```bash
npm install -g vercel
vercel
```

### Set up Cron Jobs

See `app/api/cron/README.md` for detailed instructions on setting up:
- Monthly DCA calculation (end of month)
- LINE notifications (1st of month)

## License

MIT

## Support

For issues or questions, please open an issue on GitHub.
