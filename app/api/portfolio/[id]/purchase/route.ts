import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/portfolio/[id]/purchase
 * Record a stock purchase
 */
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params  // Await the params Promise
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { symbol, shares, price_per_share, purchase_date, notes } = body

        // Validate
        if (!symbol || !shares || !price_per_share) {
            return NextResponse.json(
                { error: 'Missing required fields: symbol, shares, price_per_share' },
                { status: 400 }
            )
        }

        // Verify portfolio ownership
        const { data: portfolio, error: portfolioError } = await supabase
            .from('portfolios')
            .select('id, user_id')
            .eq('id', id)
            .eq('user_id', user.id)
            .single()

        if (portfolioError || !portfolio) {
            return NextResponse.json({ error: 'Portfolio not found' }, { status: 404 })
        }

        // Calculate total
        const total_amount = parseFloat(shares) * parseFloat(price_per_share)

        // Insert purchase record
        const { data: purchase, error: insertError } = await supabase
            .from('portfolio_purchases')
            .insert({
                portfolio_id: id,
                symbol: symbol.toUpperCase(),
                shares: parseFloat(shares),
                price_per_share: parseFloat(price_per_share),
                total_amount,
                purchase_date: purchase_date || new Date().toISOString().split('T')[0],
                notes,
                user_id: user.id
            })
            .select()
            .single()

        if (insertError) {
            console.error('[Purchase] Error recording purchase:', insertError)
            throw new Error('Failed to record purchase')
        }

        console.log(`[Purchase] ✅ Recorded purchase: ${symbol} × ${shares} @ $${price_per_share}`)

        return NextResponse.json({
            success: true,
            purchase
        })
    } catch (error: any) {
        console.error('[Purchase] Error:', error)
        return NextResponse.json(
            { error: error.message || 'Failed to record purchase' },
            { status: 500 }
        )
    }
}

/**
 * GET /api/portfolio/[id]/purchase
 * Get all purchases for a portfolio
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params  // Await the params Promise
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { data: purchases, error } = await supabase
            .from('portfolio_purchases')
            .select('*')
            .eq('portfolio_id', id)
            .eq('user_id', user.id)
            .order('purchase_date', { ascending: false })

        if (error) {
            throw error
        }

        // Group by symbol and calculate totals
        const summary: Record<string, {
            symbol: string
            total_shares: number
            total_amount: number
            average_price: number
            purchase_count: number
        }> = {}

        purchases?.forEach(purchase => {
            if (!summary[purchase.symbol]) {
                summary[purchase.symbol] = {
                    symbol: purchase.symbol,
                    total_shares: 0,
                    total_amount: 0,
                    average_price: 0,
                    purchase_count: 0
                }
            }

            summary[purchase.symbol].total_shares += parseFloat(purchase.shares)
            summary[purchase.symbol].total_amount += parseFloat(purchase.total_amount)
            summary[purchase.symbol].purchase_count += 1
        })

        // Calculate average prices
        Object.values(summary).forEach(item => {
            item.average_price = item.total_amount / item.total_shares
        })

        return NextResponse.json({
            purchases,
            summary: Object.values(summary)
        })
    } catch (error: any) {
        console.error('[Purchase] Error fetching purchases:', error)
        return NextResponse.json(
            { error: error.message || 'Failed to fetch purchases' },
            { status: 500 }
        )
    }
}
