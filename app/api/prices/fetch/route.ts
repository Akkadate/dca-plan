import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'
import { fetchStockPrices } from '@/lib/stockApi'

/**
 * API Route: Fetch and cache stock prices
 * GET /api/prices/fetch?symbol=AAPL
 */
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams
        const symbol = searchParams.get('symbol')

        if (!symbol) {
            return NextResponse.json(
                { error: 'Symbol parameter is required' },
                { status: 400 }
            )
        }

        // Use regular client for reading (respects RLS)
        const supabase = await createServerClient()

        // Check if we have recent data (within last 24 hours)
        const yesterday = new Date()
        yesterday.setDate(yesterday.getDate() - 1)

        const { data: cachedPrices } = await supabase
            .from('stock_prices')
            .select('*')
            .eq('symbol', symbol.toUpperCase())
            .gte('date', yesterday.toISOString().split('T')[0])
            .order('date', { ascending: false })

        if (cachedPrices && cachedPrices.length > 0) {
            return NextResponse.json({
                symbol: symbol.toUpperCase(),
                prices: cachedPrices,
                cached: true,
            })
        }

        // Fetch fresh data from API
        const prices = await fetchStockPrices(symbol.toUpperCase())

        // Store in database using SERVICE ROLE to bypass RLS
        const priceRecords = prices.map(p => ({
            symbol: p.symbol.toUpperCase(),
            date: p.date,
            close_price: p.close,
        }))

        // Create service role client
        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false
                }
            }
        )

        // Upsert prices (on conflict, do nothing - we only need historical data)
        const { error: insertError } = await supabaseAdmin
            .from('stock_prices')
            .upsert(priceRecords, { onConflict: 'symbol,date', ignoreDuplicates: true })

        if (insertError) {
            console.error('Error storing prices:', insertError)
            // Continue even if storage fails
        }

        return NextResponse.json({
            symbol: symbol.toUpperCase(),
            prices: priceRecords,
            cached: false,
        })
    } catch (error: any) {
        console.error('Error fetching stock prices:', error)
        return NextResponse.json(
            { error: error.message || 'Failed to fetch stock prices' },
            { status: 500 }
        )
    }
}
