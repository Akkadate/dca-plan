// Database types based on Supabase schema
export interface User {
    id: string
    created_at: string
    updated_at: string
}

export interface Portfolio {
    id: string
    user_id: string
    name: string
    monthly_budget: number
    created_at: string
    updated_at: string
}

export interface PortfolioStock {
    id: string
    portfolio_id: string
    symbol: string
    target_weight: number
    min_weight: number
    max_weight: number
    created_at: string
    updated_at: string
}

export interface StockPrice {
    id: string
    symbol: string
    date: string
    close_price: number
    created_at: string
}

export interface DCARecommendation {
    id: string
    portfolio_id: string
    month: string // YYYY-MM format
    symbol: string
    amount_usd: number
    weight: number
    reason_text: string
    created_at: string
}

export interface LineProfile {
    id: string
    user_id: string
    line_user_id: string
    created_at: string
    updated_at: string
}

// Extended types with relations
export interface PortfolioWithStocks extends Portfolio {
    portfolio_stocks: PortfolioStock[]
}

export interface RecommendationWithPortfolio extends DCARecommendation {
    portfolio: Portfolio
}
