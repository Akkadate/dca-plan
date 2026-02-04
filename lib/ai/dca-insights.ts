import OpenAI from 'openai'

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
})

export interface DCAInsight {
    symbol: string
    insight: string
    riskLevel: 'low' | 'medium' | 'high'
    newsItems?: string[]
}

export interface DCARecommendation {
    symbol: string
    finalWeight: number
    amountUSD: number
    reason: string
    currentPrice: number
    ma50: number
}

/**
 * Generate AI insights for DCA recommendations
 * 
 * IMPORTANT: This does NOT change DCA weights!
 * The algorithm has already calculated weights using MA50 rule-based logic.
 * AI only provides context, analysis, and risk assessment.
 * 
 * Cost Optimization:
 * - Uses gpt-4o-mini (cheapest model)
 * - Limits max_tokens to 800
 * - Temperature 0.3 for consistency
 * - Can be cached for 24 hours
 */
export async function generateDCAInsights(
    recommendations: DCARecommendation[]
): Promise<DCAInsight[]> {
    try {
        console.log('[AI Insights] Generating insights for', recommendations.length, 'stocks...')

        const prompt = `You are a financial analyst providing context for DCA (Dollar-Cost Averaging) investment recommendations.

CRITICAL: You are NOT changing the DCA weights. The algorithm has already calculated them using MA50 rule-based logic. Your role is ONLY to provide insights and context.

Here are this month's DCA recommendations:

${recommendations.map(r => `
${r.symbol}:
- Allocated Amount: $${r.amountUSD.toFixed(2)} (${r.finalWeight.toFixed(1)}%)
- Current Price: $${r.currentPrice.toFixed(2)}
- MA50 (50-day average): $${r.ma50.toFixed(2)}
- Price vs MA50: ${((r.currentPrice / r.ma50 - 1) * 100).toFixed(1)}%
- Algorithm Decision: ${r.reason}
`).join('\n')}

For each stock, provide:
1. Brief market context (1-2 sentences max)
2. Recent relevant news or events (if any)
3. Risk level assessment (low/medium/high)
4. Whether algorithm's decision aligns with fundamentals

Keep VERY concise - max 2-3 sentences per stock.
Format as JSON: {"insights": [{"symbol": "AAPL", "insight": "...", "riskLevel": "low", "newsItems": ["..."]}]}`

        const startTime = Date.now()

        const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                {
                    role: 'system',
                    content: 'You are a financial analyst providing context for DCA investments. You provide insights but DO NOT change investment weights. Be concise.'
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],
            response_format: { type: 'json_object' },
            temperature: 0.3,
            max_tokens: 800  // Cost optimization: limit output
        })

        const duration = Date.now() - startTime
        const usage = response.usage

        console.log('[AI Insights] ✅ Generated in', duration, 'ms')
        console.log('[AI Insights] Tokens:', {
            input: usage?.prompt_tokens,
            output: usage?.completion_tokens,
            total: usage?.total_tokens
        })

        // Cost calculation (gpt-4o-mini pricing)
        const inputCost = (usage?.prompt_tokens || 0) * 0.150 / 1_000_000
        const outputCost = (usage?.completion_tokens || 0) * 0.600 / 1_000_000
        const totalCost = inputCost + outputCost
        console.log('[AI Insights] Cost: $' + totalCost.toFixed(6))

        const content = response.choices[0].message.content
        if (!content) {
            throw new Error('No response from AI')
        }

        const parsed = JSON.parse(content)
        const insights = parsed.insights || []

        console.log('[AI Insights] ✅ Generated', insights.length, 'insights')

        return insights
    } catch (error: any) {
        console.error('[AI Insights] ❌ Error generating insights:', error.message)
        // Return empty insights on error - don't break DCA calculation
        console.warn('[AI Insights] Falling back to no insights')
        return []
    }
}

/**
 * Cache for AI insights (24 hour TTL)
 * Key: portfolioId-YYYY-MM-DD
 * Value: DCAInsight[]
 */
const insightsCache = new Map<string, {
    insights: DCAInsight[]
    timestamp: number
}>()

const CACHE_TTL = 24 * 60 * 60 * 1000  // 24 hours

/**
 * Get cached insights or generate new ones
 * Cost optimization: avoid regenerating insights for same portfolio on same day
 */
export async function getCachedInsights(
    portfolioId: string,
    recommendations: DCARecommendation[]
): Promise<DCAInsight[]> {
    const today = new Date().toISOString().split('T')[0]
    const cacheKey = `${portfolioId}-${today}`

    // Check cache
    const cached = insightsCache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        console.log('[AI Insights] ✅ Using cached insights')
        return cached.insights
    }

    // Generate new insights
    const insights = await generateDCAInsights(recommendations)

    // Cache for 24 hours
    insightsCache.set(cacheKey, {
        insights,
        timestamp: Date.now()
    })

    // Clean old cache entries (optional)
    const now = Date.now()
    for (const [key, value] of insightsCache.entries()) {
        if (now - value.timestamp > CACHE_TTL) {
            insightsCache.delete(key)
        }
    }

    return insights
}
