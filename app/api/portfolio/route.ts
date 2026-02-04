import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Create Portfolio API
 * POST /api/portfolio
 * 
 * Expects: { name, monthly_budget, stocks: [{ symbol, target_weight, min_weight, max_weight }] }
 */
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()

        // Check authentication
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const body = await request.json()
        const { name, monthly_budget, stocks } = body

        // Validate input
        if (!name || !monthly_budget || !stocks || !Array.isArray(stocks) || stocks.length === 0) {
            return NextResponse.json(
                { error: 'Missing required fields: name, monthly_budget, stocks (array)' },
                { status: 400 }
            )
        }

        if (monthly_budget <= 0) {
            return NextResponse.json(
                { error: 'Monthly budget must be greater than 0' },
                { status: 400 }
            )
        }

        // Validate stocks structure
        for (const stock of stocks) {
            if (!stock.symbol || stock.target_weight === undefined) {
                return NextResponse.json(
                    { error: 'Each stock must have symbol and target_weight' },
                    { status: 400 }
                )
            }
        }

        // Create portfolio
        const { data: portfolio, error: portfolioError } = await supabase
            .from('portfolios')
            .insert({
                name,
                monthly_budget,
                user_id: user.id
            })
            .select()
            .single()

        if (portfolioError) {
            console.error('Portfolio creation error:', portfolioError)
            throw new Error('Failed to create portfolio')
        }

        // Create stocks
        const stockInserts = stocks.map((stock: any) => ({
            portfolio_id: portfolio.id,
            symbol: stock.symbol.toUpperCase().trim(),
            target_weight: stock.target_weight,
            min_weight: stock.min_weight || Math.max(0, stock.target_weight - 5),
            max_weight: stock.max_weight || Math.min(100, stock.target_weight + 5)
        }))

        const { error: stocksError } = await supabase
            .from('portfolio_stocks')
            .insert(stockInserts)

        if (stocksError) {
            console.error('Stocks creation error:', stocksError)
            // Rollback: delete portfolio if stocks creation fails
            await supabase.from('portfolios').delete().eq('id', portfolio.id)
            throw new Error('Failed to create portfolio stocks')
        }

        // Fetch and store 50 days of historical stock prices for immediate Smart DCA capability
        console.log(`[Portfolio Create] Fetching 50-day historical data for ${stocks.length} stocks...`)

        try {
            const { fetchHistoricalPrices } = await import('@/lib/stock-data/fetcher')

            const pricePromises = stocks.map(async (stock: any) => {
                try {
                    const symbol = stock.symbol.toUpperCase().trim()

                    // Determine market from symbol or explicit market field
                    const market = stock.market || (symbol.includes('.BK') ? 'TH' : 'US')

                    // Format symbol for Yahoo Finance
                    const yahooSymbol = market === 'TH' && !symbol.includes('.')
                        ? `${symbol}.BK`
                        : symbol

                    console.log(`[Portfolio Create] Fetching historical data for ${symbol} (${market})...`)

                    // Fetch 50 days of historical data
                    const historicalPrices = await fetchHistoricalPrices(yahooSymbol, 50)

                    // Insert into database (upsert to avoid duplicates)
                    const priceInserts = historicalPrices.map(price => ({
                        symbol: symbol,
                        date: price.date,
                        close_price: price.close,
                        created_at: new Date().toISOString()
                    }))

                    const { error: insertError } = await supabase
                        .from('stock_prices')
                        .upsert(priceInserts, {
                            onConflict: 'symbol,date',
                            ignoreDuplicates: true
                        })

                    if (insertError) {
                        console.error(`[Portfolio Create] Error inserting prices for ${symbol}:`, insertError)
                        return { symbol, success: false, count: 0 }
                    }

                    console.log(`[Portfolio Create] ✅ Stored ${historicalPrices.length} historical prices for ${symbol}`)
                    return { symbol, success: true, count: historicalPrices.length }
                } catch (error: any) {
                    console.error(`[Portfolio Create] ❌ Error processing ${stock.symbol}:`, error.message)
                    return { symbol: stock.symbol, success: false, count: 0 }
                }
            })

            const results = await Promise.all(pricePromises)
            const successCount = results.filter(r => r.success).length
            const totalPrices = results.reduce((sum, r) => sum + r.count, 0)

            console.log(`[Portfolio Create] Historical data fetch complete:`)
            console.log(`  - Success: ${successCount}/${stocks.length} stocks`)
            console.log(`  - Total: ${totalPrices} price points stored`)

            // Log individual results
            results.forEach(r => {
                const status = r.success ? `✅ ${r.count} prices` : '❌ Failed'
                console.log(`  - ${r.symbol}: ${status}`)
            })

            // If most stocks succeeded, we're OK
            if (successCount >= stocks.length * 0.7) {
                console.log('[Portfolio Create] ✅ Historical data fetch completed successfully')
            } else {
                console.warn('[Portfolio Create] ⚠️ Some stocks failed to fetch historical data. DCA may use Equal weights initially.')
            }
        } catch (error: any) {
            console.error('[Portfolio Create] Error fetching historical data:', error.message)
            // Don't fail portfolio creation - DCA will fall back to Equal DCA
            console.warn('[Portfolio Create] ⚠️ Portfolio created but without historical data. DCA will use Equal weights until data is collected.')
        }

        return NextResponse.json({
            success: true,
            portfolio
        })
    } catch (error: any) {
        console.error('Error creating portfolio:', error)
        return NextResponse.json(
            { error: error.message || 'Failed to create portfolio' },
            { status: 500 }
        )
    }
}
