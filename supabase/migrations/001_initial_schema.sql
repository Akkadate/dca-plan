-- Create tables for DCA Investment System

-- Users table (references Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Portfolios table
CREATE TABLE IF NOT EXISTS public.portfolios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  monthly_budget DECIMAL(10, 2) NOT NULL CHECK (monthly_budget > 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Portfolio stocks table
CREATE TABLE IF NOT EXISTS public.portfolio_stocks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  portfolio_id UUID REFERENCES public.portfolios(id) ON DELETE CASCADE NOT NULL,
  symbol TEXT NOT NULL,
  target_weight DECIMAL(5, 2) NOT NULL CHECK (target_weight >= 0 AND target_weight <= 100),
  min_weight DECIMAL(5, 2) NOT NULL CHECK (min_weight >= 0 AND min_weight <= 100),
  max_weight DECIMAL(5, 2) NOT NULL CHECK (max_weight >= 0 AND max_weight <= 100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(portfolio_id, symbol),
  CHECK (min_weight <= target_weight AND target_weight <= max_weight)
);

-- Stock prices table (public read-only)
CREATE TABLE IF NOT EXISTS public.stock_prices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  symbol TEXT NOT NULL,
  date DATE NOT NULL,
  close_price DECIMAL(10, 4) NOT NULL CHECK (close_price > 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(symbol, date)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_stock_prices_symbol_date ON public.stock_prices(symbol, date DESC);

-- DCA recommendations table
CREATE TABLE IF NOT EXISTS public.dca_recommendations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  portfolio_id UUID REFERENCES public.portfolios(id) ON DELETE CASCADE NOT NULL,
  month TEXT NOT NULL, -- Format: YYYY-MM
  symbol TEXT NOT NULL,
  amount_usd DECIMAL(10, 2) NOT NULL CHECK (amount_usd >= 0),
  weight DECIMAL(5, 2) NOT NULL CHECK (weight >= 0 AND weight <= 100),
  reason_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(portfolio_id, month, symbol)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_dca_recommendations_portfolio_month ON public.dca_recommendations(portfolio_id, month DESC);

-- LINE profiles table
CREATE TABLE IF NOT EXISTS public.line_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  line_user_id TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_portfolios_updated_at BEFORE UPDATE ON public.portfolios
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_portfolio_stocks_updated_at BEFORE UPDATE ON public.portfolio_stocks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_line_profiles_updated_at BEFORE UPDATE ON public.line_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
