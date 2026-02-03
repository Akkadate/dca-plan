import OpenAI from 'openai'

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
})

export interface PortfolioObjective {
    market: 'US' | 'TH'
    objective: 'growth' | 'dividend' | 'capital_gain' | 'value' | 'balanced'
    risk_tolerance: 'low' | 'medium' | 'high'
    budget: number
    sectors?: string[]
}

export interface StockRecommendation {
    symbol: string
    name: string
    current_price: number
    metrics: {
        pe_ratio: number | null
        dividend_yield: number | null
        market_cap: string
        week52_high: number
        week52_low: number
        beta: number | null
    }
    weights: {
        target: number
        min: number
        max: number
    }
    reasoning: string
}

export interface PortfolioRecommendation {
    recommendations: StockRecommendation[]
    portfolio_summary: {
        risk_level: string
        expected_return: string
        diversification_score: number
        total_stocks: number
    }
}

const SYSTEM_PROMPT = `You are an expert financial advisor AI specializing in DCA (Dollar Cost Averaging) portfolio construction.

Your expertise covers:
- US Market: NYSE, NASDAQ stocks
- Thai Market: SET (Stock Exchange of Thailand)

Your role:
1. Analyze user's investment objectives and risk tolerance
2. Recommend 4-6 stocks suitable for long-term DCA strategy
3. Provide realistic target/min/max allocation weights (must sum to 100%)
4. Include detailed reasoning for each stock selection
5. Assess overall portfolio risk and expected characteristics

Guidelines:
- For GROWTH objective: Focus on high-growth tech, innovative companies
- For DIVIDEND objective: Focus on dividend aristocrats, stable yields
- For CAPITAL GAIN: Focus on moderate growth with capital appreciation potential
- For VALUE: Focus on undervalued stocks with strong fundamentals
- For BALANCED: Mix of growth and stability

Return ONLY valid JSON matching the exact format specified.`

function buildUserPrompt(params: PortfolioObjective): string {
    const marketName = params.market === 'US' ? 'US Market (NYSE/NASDAQ)' : 'Thai Market (SET)'
    const objectiveDesc = {
        growth: 'High-growth stocks with strong future potential',
        dividend: 'Dividend-paying stocks for passive income',
        capital_gain: 'Moderate growth stocks for capital appreciation',
        value: 'Undervalued stocks with strong fundamentals',
        balanced: 'Mix of growth and dividend stocks'
    }

    return `Recommend a DCA portfolio with the following requirements:

Market: ${marketName}
Investment Objective: ${objectiveDesc[params.objective]}
Risk Tolerance: ${params.risk_tolerance}
Monthly Budget: ${params.market === 'US' ? '$' : '฿'}${params.budget}
${params.sectors && params.sectors.length > 0 ? `Preferred Sectors: ${params.sectors.join(', ')}` : ''}

Requirements:
1. Recommend 4-6 stocks suitable for this profile
2. For each stock provide:
   - symbol: Stock ticker symbol
   - name: Full company name
   - current_price: Estimated current price
   - metrics:
     * pe_ratio: Price-to-Earnings ratio (or null if N/A)
     * dividend_yield: Annual dividend yield % (or null if no dividend)
     * market_cap: Market capitalization in readable format (e.g., "2.8T", "150B")
     * week52_high: 52-week high price
     * week52_low: 52-week low price
     * beta: Stock volatility vs market (or null if N/A)
   - weights:
     * target: Target allocation % (must sum to 100% across all stocks)
     * min: Minimum allocation % (at least 5% below target)
     * max: Maximum allocation % (at least 5% above target)
   - reasoning: 2-3 sentences explaining why this stock fits the objective

3. Provide portfolio_summary:
   - risk_level: "Low", "Medium-Low", "Medium", "Medium-High", or "High"
   - expected_return: Annual return estimate (e.g., "8-12%")
   - diversification_score: Score from 1-10
   - total_stocks: Number of stocks recommended

Return ONLY a valid JSON object with this exact structure:
{
  "recommendations": [
    {
      "symbol": "AAPL",
      "name": "Apple Inc.",
      "current_price": 180.50,
      "metrics": {
        "pe_ratio": 28.5,
        "dividend_yield": 0.5,
        "market_cap": "2.8T",
        "week52_high": 195.0,
        "week52_low": 140.0,
        "beta": 1.2
      },
      "weights": {
        "target": 25,
        "min": 20,
        "max": 30
      },
      "reasoning": "Strong fundamentals with consistent revenue growth..."
    }
  ],
  "portfolio_summary": {
    "risk_level": "Medium",
    "expected_return": "10-15%",
    "diversification_score": 8.5,
    "total_stocks": 5
  }
}`
}

export async function getStockRecommendations(
    params: PortfolioObjective
): Promise<PortfolioRecommendation> {
    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [
                { role: 'system', content: SYSTEM_PROMPT },
                { role: 'user', content: buildUserPrompt(params) }
            ],
            response_format: { type: 'json_object' },
            temperature: 0.7,
            max_tokens: 2500
        })

        const content = response.choices[0].message.content
        if (!content) {
            throw new Error('No response from OpenAI')
        }

        const result = JSON.parse(content) as PortfolioRecommendation

        // Validate response
        if (!result.recommendations || result.recommendations.length === 0) {
            throw new Error('No recommendations returned')
        }

        // Validate weights sum to 100%
        const totalWeight = result.recommendations.reduce(
            (sum, stock) => sum + stock.weights.target,
            0
        )
        if (Math.abs(totalWeight - 100) > 0.1) {
            console.warn(`Weights sum to ${totalWeight}%, adjusting...`)
            // Normalize weights
            const factor = 100 / totalWeight
            result.recommendations.forEach(stock => {
                stock.weights.target = Math.round(stock.weights.target * factor * 10) / 10
                stock.weights.min = Math.max(0, stock.weights.target - 5)
                stock.weights.max = Math.min(100, stock.weights.target + 5)
            })
        }

        return result
    } catch (error: any) {
        console.error('Error getting stock recommendations:', error)
        throw new Error(`Failed to get AI recommendations: ${error.message}`)
    }
}

export { openai }
