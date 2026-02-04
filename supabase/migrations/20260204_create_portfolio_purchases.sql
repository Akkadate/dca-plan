-- Create portfolio_purchases table for tracking actual stock purchases
-- This enables DCA to adjust based on actual portfolio weights

CREATE TABLE IF NOT EXISTS portfolio_purchases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    portfolio_id UUID NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
    symbol VARCHAR(20) NOT NULL,
    purchase_date DATE NOT NULL,
    shares DECIMAL(18, 8) NOT NULL CHECK (shares > 0),
    price_per_share DECIMAL(18, 2) NOT NULL CHECK (price_per_share > 0),
    total_amount DECIMAL(18, 2) NOT NULL CHECK (total_amount > 0),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    user_id UUID NOT NULL REFERENCES auth.users(id)
);

-- Indexes for performance
CREATE INDEX idx_portfolio_purchases_portfolio ON portfolio_purchases(portfolio_id);
CREATE INDEX idx_portfolio_purchases_symbol ON portfolio_purchases(symbol);
CREATE INDEX idx_portfolio_purchases_date ON portfolio_purchases(purchase_date DESC);
CREATE INDEX idx_portfolio_purchases_user ON portfolio_purchases(user_id);

-- Enable Row Level Security
ALTER TABLE portfolio_purchases ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own purchases"
ON portfolio_purchases FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own purchases"
ON portfolio_purchases FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own purchases"
ON portfolio_purchases FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own purchases"
ON portfolio_purchases FOR DELETE
USING (auth.uid() = user_id);

-- Add comment
COMMENT ON TABLE portfolio_purchases IS 'Tracks actual stock purchases to calculate real portfolio weights for DCA adjustments';
