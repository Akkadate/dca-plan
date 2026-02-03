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
