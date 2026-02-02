-- Enable Row Level Security for all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_stocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dca_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.line_profiles ENABLE ROW LEVEL SECURITY;

-- Users table policies
CREATE POLICY "Users can view their own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.users FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Portfolios table policies
CREATE POLICY "Users can view their own portfolios"
  ON public.portfolios FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own portfolios"
  ON public.portfolios FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own portfolios"
  ON public.portfolios FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own portfolios"
  ON public.portfolios FOR DELETE
  USING (auth.uid() = user_id);

-- Portfolio stocks table policies
CREATE POLICY "Users can view stocks in their portfolios"
  ON public.portfolio_stocks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.portfolios
      WHERE portfolios.id = portfolio_stocks.portfolio_id
      AND portfolios.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can add stocks to their portfolios"
  ON public.portfolio_stocks FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.portfolios
      WHERE portfolios.id = portfolio_stocks.portfolio_id
      AND portfolios.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update stocks in their portfolios"
  ON public.portfolio_stocks FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.portfolios
      WHERE portfolios.id = portfolio_stocks.portfolio_id
      AND portfolios.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete stocks from their portfolios"
  ON public.portfolio_stocks FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.portfolios
      WHERE portfolios.id = portfolio_stocks.portfolio_id
      AND portfolios.user_id = auth.uid()
    )
  );

-- Stock prices table policies (read-only for all authenticated users)
CREATE POLICY "Authenticated users can view stock prices"
  ON public.stock_prices FOR SELECT
  TO authenticated
  USING (true);

-- DCA recommendations table policies
CREATE POLICY "Users can view their own recommendations"
  ON public.dca_recommendations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.portfolios
      WHERE portfolios.id = dca_recommendations.portfolio_id
      AND portfolios.user_id = auth.uid()
    )
  );

-- LINE profiles table policies
CREATE POLICY "Users can view their own LINE profile"
  ON public.line_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own LINE profile"
  ON public.line_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own LINE profile"
  ON public.line_profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own LINE profile"
  ON public.line_profiles FOR DELETE
  USING (auth.uid() = user_id);
