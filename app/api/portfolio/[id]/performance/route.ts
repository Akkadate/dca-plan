import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { compareStrategies } from '@/lib/backtest/calculator'

/**
 * Portfolio Performance Comparison API
 * GET /api/portfolio/[id]/performance
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: portfolioId } = await params

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false
                }
            }
        )

        // Fetch all recommendations for this portfolio
        const { data: recommendations, error: recsError } = await supabase
            .from('dca_recommendations')
            .select('*')
            .eq('portfolio_id', portfolioId)
            .order('month', { ascending: true })

        if (recsError) throw recsError

        if (!recommendations || recommendations.length === 0) {
            return NextResponse.json({
                error: 'No recommendations found',
                message: 'Need at least one month of DCA recommendations to calculate performance'
            }, { status: 404 })
        }

        // Get unique symbols
        const symbols = [...new Set(recommendations.map(r => r.symbol))]

        // Fetch price data for all symbols
        const pricePromises = symbols.map(async (symbol) => {
            const { data: prices } = await supabase
                .from('stock_prices')
                .select('*')
                .eq('symbol', symbol)
                .order('date', { ascending: false })

            return { symbol, prices: prices || [] }
        })

        const priceResults = await Promise.all(pricePromises)

        // Convert to price map
        const priceData: { [symbol: string]: any[] } = {}
        for (const result of priceResults) {
            priceData[result.symbol] = result.prices
        }

        // Calculate performance comparison
        const comparison = compareStrategies(recommendations, priceData)

        return NextResponse.json({
            success: true,
            comparison,
            metadata: {
                months_analyzed: recommendations.length / symbols.length,
                symbols,
                oldest_month: recommendations[0].month,
                latest_month: recommendations[recommendations.length - 1].month
            }
        })
    } catch (error: any) {
        console.error('Error calculating performance:', error)
        return NextResponse.json(
            { error: error.message || 'Failed to calculate performance' },
            { status: 500 }
        )
    }
}
