import { NextRequest, NextResponse } from 'next/server'
import { getStockRecommendations, PortfolioObjective } from '@/lib/ai/portfolio-advisor'
import { batchFetchStockData } from '@/lib/stock-data/fetcher'

/**
 * AI Stock Recommendation API
 * POST /api/ai/recommend-stocks
 * 
 * Hybrid approach:
 * 1. AI recommends symbols + reasoning + weights
 * 2. Fetch real-time metrics from Alpha Vantage (US) or Yahoo Finance (Thai)
 * 3. Merge and return combined data
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()

        const {
            market,
            objective,
            risk_tolerance,
            budget,
            sectors
        } = body as PortfolioObjective

        // Validate input
        if (!market || !objective || !risk_tolerance || !budget) {
            return NextResponse.json(
                { error: 'Missing required fields: market, objective, risk_tolerance, budget' },
                { status: 400 }
            )
        }

        if (!['US', 'TH'].includes(market)) {
            return NextResponse.json(
                { error: 'Market must be either US or TH' },
                { status: 400 }
            )
        }

        if (!['growth', 'dividend', 'capital_gain', 'value', 'balanced'].includes(objective)) {
            return NextResponse.json(
                { error: 'Invalid objective' },
                { status: 400 }
            )
        }

        if (budget <= 0) {
            return NextResponse.json(
                { error: 'Budget must be greater than 0' },
                { status: 400 }
            )
        }

        // Step 1: Get AI recommendations (symbols + reasoning + weights only)
        console.log('Step 1: Calling OpenAI for recommendations...')
        const aiResponse = await getStockRecommendations({
            market,
            objective,
            risk_tolerance,
            budget,
            sectors: sectors || []
        })
        console.log(`Step 1 Complete: AI recommended ${aiResponse.recommendations.length} stocks`)

        // Step 2: Extract symbols
        const symbols = aiResponse.recommendations.map(rec => rec.symbol)
        console.log(`Step 2: Extracted symbols: ${symbols.join(', ')}`)

        // Step 3: Fetch real-time stock data for all symbols
        console.log(`Step 3: Fetching real-time ${market} market data for ${symbols.length} stocks...`)
        console.log(`Environment check: STOCK_API_KEY=${process.env.STOCK_API_KEY ? 'SET' : 'NOT SET'}`)
        console.log(`Environment check: OPENAI_API_KEY=${process.env.OPENAI_API_KEY ? 'SET' : 'NOT SET'}`)

        const stocksData = await batchFetchStockData(symbols, market)
        console.log(`Step 3 Complete: Fetched ${stocksData.length} stock data entries`)

        // Log first stock data for debugging
        if (stocksData.length > 0) {
            console.log('Sample stock data:', JSON.stringify(stocksData[0], null, 2))
        }

        // Step 4: Merge AI reasoning + Real metrics
        console.log('Step 4: Merging AI reasoning with real stock data...')
        const enrichedRecommendations = aiResponse.recommendations.map((rec, index) => {
            const stockData = stocksData[index]

            return {
                symbol: stockData.symbol,
                name: stockData.name || rec.name,
                current_price: stockData.current_price,
                metrics: stockData.metrics,
                weights: rec.weights,
                reasoning: rec.reasoning,
                isEstimate: stockData.isEstimate,
                error: stockData.error
            }
        })

        console.log('Step 4 Complete: Enriched recommendations ready')

        return NextResponse.json({
            success: true,
            recommendations: enrichedRecommendations,
            portfolio_summary: aiResponse.portfolio_summary
        })
    } catch (error: any) {
        console.error('Error in recommend-stocks API:', error)
        return NextResponse.json(
            {
                error: error.message || 'Failed to get recommendations',
                details: process.env.NODE_ENV === 'development' ? error.stack : undefined
            },
            { status: 500 }
        )
    }
}
