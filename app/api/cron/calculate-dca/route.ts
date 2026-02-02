import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { calculatePortfolioDCA, calculateEqualDCA, DCAInput } from '@/lib/dca/calculator'
import { StockPrice } from '@/lib/types/database'

/**
 * Monthly DCA Calculation Job
 * Triggered by Supabase Cron or GitHub Actions
 * Should run at the end of each month
 * 
 * API Route: POST /api/cron/calculate-dca
 * Headers: Authorization: Bearer <CRON_SECRET>
 */
export async function POST(request: NextRequest) {
    try {
        // Verify authorization (cron secret)
        const authHeader = request.headers.get('authorization')
        const cronSecret = process.env.CRON_SECRET || 'your-secret-key'

        if (authHeader !== `Bearer ${cronSecret}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Use service role to bypass RLS
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        )

        // Get all portfolios
        const { data: portfolios, error: portfoliosError } = await supabase
            .from('portfolios')
            .select(`
        *,
        portfolio_stocks (*)
      `)

        if (portfoliosError) throw portfoliosError

        const currentMonth = new Date().toISOString().slice(0, 7) // YYYY-MM
        const results = []

        for (const portfolio of portfolios || []) {
            try {
                const stocks = portfolio.portfolio_stocks

                if (!stocks || stocks.length === 0) {
                    console.log(`Portfolio ${portfolio.id} has no stocks, skipping`)
                    continue
                }

                // Fetch stock prices for all symbols
                const pricePromises = stocks.map(async (stock: any) => {
                    const { data: prices } = await supabase
                        .from('stock_prices')
                        .select('*')
                        .eq('symbol', stock.symbol)
                        .order('date', { ascending: false })
                        .limit(180) // 6 months of daily data

                    return {
                        stock,
                        prices: prices || [],
                    }
                })

                const stockPricesData = await Promise.all(pricePromises)

                // Check if we have sufficient data
                const insufficientData = stockPricesData.some(
                    ({ prices }) => prices.length < 6
                )

                let recommendations

                if (insufficientData) {
                    // Fallback to equal DCA
                    console.log(`Insufficient data for portfolio ${portfolio.id}, using equal DCA`)
                    recommendations = calculateEqualDCA(stocks, parseFloat(portfolio.monthly_budget))
                } else {
                    // Prepare inputs for DCA calculation
                    const inputs: DCAInput[] = stockPricesData.map(({ stock, prices }) => ({
                        stock,
                        currentPrice: parseFloat(prices[0].close_price),
                        priceHistory: prices as StockPrice[],
                        monthlyBudget: parseFloat(portfolio.monthly_budget),
                    }))

                    // Calculate DCA
                    recommendations = calculatePortfolioDCA(inputs)
                }

                // Store recommendations in database
                const recommendationRecords = recommendations.map(rec => ({
                    portfolio_id: portfolio.id,
                    month: currentMonth,
                    symbol: rec.symbol,
                    amount_usd: rec.amountUSD,
                    weight: rec.finalWeight,
                    reason_text: rec.reason,
                }))

                const { error: insertError } = await supabase
                    .from('dca_recommendations')
                    .upsert(recommendationRecords, {
                        onConflict: 'portfolio_id,month,symbol',
                    })

                if (insertError) {
                    console.error(`Error storing recommendations for portfolio ${portfolio.id}:`, insertError)
                } else {
                    results.push({
                        portfolio_id: portfolio.id,
                        month: currentMonth,
                        recommendations_count: recommendations.length,
                    })
                }
            } catch (error) {
                console.error(`Error processing portfolio ${portfolio.id}:`, error)
                // Continue with next portfolio
            }
        }

        return NextResponse.json({
            success: true,
            month: currentMonth,
            processed: results,
        })
    } catch (error: any) {
        console.error('Error in DCA calculation job:', error)
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        )
    }
}
