import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * LINE Notification Job
 * Sends DCA plans via LINE Messaging API
 * Should run on the 1st of each month
 * 
 * API Route: POST /api/cron/send-line-notifications
 * Headers: Authorization: Bearer <CRON_SECRET>
 */
export async function POST(request: NextRequest) {
    try {
        // Verify authorization
        const authHeader = request.headers.get('authorization')
        const cronSecret = process.env.CRON_SECRET || 'your-secret-key'

        if (authHeader !== `Bearer ${cronSecret}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const lineToken = process.env.LINE_CHANNEL_ACCESS_TOKEN
        if (!lineToken) {
            throw new Error('LINE_CHANNEL_ACCESS_TOKEN not configured')
        }

        // Use service role
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        )

        const currentMonth = new Date().toISOString().slice(0, 7) // YYYY-MM
        const monthName = new Date().toLocaleDateString('th-TH', {
            month: 'long',
            year: 'numeric'
        })

        // Get all LINE profiles with their users
        const { data: lineProfiles, error: profilesError } = await supabase
            .from('line_profiles')
            .select('*')

        if (profilesError) throw profilesError

        const results = []

        for (const profile of lineProfiles || []) {
            try {
                // Get user's portfolios
                const { data: portfolios } = await supabase
                    .from('portfolios')
                    .select('id, name')
                    .eq('user_id', profile.user_id)

                if (!portfolios || portfolios.length === 0) {
                    console.log(`User ${profile.user_id} has no portfolios, skipping`)
                    continue
                }

                // Get recommendations for all portfolios
                for (const portfolio of portfolios) {
                    const { data: recommendations } = await supabase
                        .from('dca_recommendations')
                        .select('*')
                        .eq('portfolio_id', portfolio.id)
                        .eq('month', currentMonth)
                        .order('amount_usd', { ascending: false })

                    if (!recommendations || recommendations.length === 0) {
                        console.log(`No recommendations for portfolio ${portfolio.id}`)
                        continue
                    }

                    // Get portfolio monthly budget
                    const { data: portfolioData } = await supabase
                        .from('portfolios')
                        .select('monthly_budget')
                        .eq('id', portfolio.id)
                        .single()

                    const monthlyBudget = portfolioData?.monthly_budget || '0'

                    // Generate AI insights (with caching)
                    let insights: any[] = []
                    try {
                        const { getCachedInsights } = await import('@/lib/ai/dca-insights')
                        const { calculateMA50 } = await import('@/lib/dca/calculator')

                        // Get price history for MA50 calculation
                        const { data: stockPrices } = await supabase
                            .from('stock_prices')
                            .select('symbol, close_price')
                            .in('symbol', recommendations.map(r => r.symbol))
                            .order('date', { ascending: false })
                            .limit(50 * recommendations.length)

                        // Prepare recommendations with MA50 data
                        const recsWithMA = recommendations.map(rec => {
                            const prices = stockPrices?.filter(p => p.symbol === rec.symbol) || []
                            const ma50 = prices.length >= 50
                                ? prices.slice(0, 50).reduce((sum, p) => sum + parseFloat(p.close_price), 0) / 50
                                : parseFloat(rec.amount_usd) / parseFloat(rec.weight) * 100  // Fallback

                            return {
                                symbol: rec.symbol,
                                finalWeight: parseFloat(rec.weight),
                                amountUSD: parseFloat(rec.amount_usd),
                                reason: rec.reason_text,
                                currentPrice: prices[0] ? parseFloat(prices[0].close_price) : 0,
                                ma50
                            }
                        })

                        insights = await getCachedInsights(portfolio.id, recsWithMA)
                        console.log(`[LINE] Generated ${insights.length} AI insights for portfolio ${portfolio.id}`)
                    } catch (error) {
                        console.error(`[LINE] Error generating AI insights:`, error)
                        // Continue without insights - not critical
                    }

                    // Format LINE message (with insights)
                    const message = formatLineMessage(
                        portfolio.name,
                        monthlyBudget,
                        recommendations,
                        insights  // Include AI insights
                    )

                    // Send LINE message
                    const sent = await sendLineMessage(
                        profile.line_user_id,
                        message,
                        lineToken
                    )

                    if (sent) {
                        results.push({
                            user_id: profile.user_id,
                            portfolio_id: portfolio.id,
                            line_user_id: profile.line_user_id,
                            status: 'sent',
                            ai_insights: insights.length
                        })
                    }
                }
            } catch (error) {
                console.error(`Error sending LINE to user ${profile.user_id}:`, error)
                results.push({
                    user_id: profile.user_id,
                    status: 'error',
                    error: (error as Error).message,
                })
            }
        }

        return NextResponse.json({
            success: true,
            month: currentMonth,
            sent: results,
        })
    } catch (error: any) {
        console.error('Error in LINE notification job:', error)
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        )
    }
}

/**
 * Format DCA recommendations as LINE message
 * With optional AI insights for context
 */
function formatLineMessage(
    portfolioName: string,
    monthlyBudget: string,
    recommendations: any[],
    insights?: any[]  // AI insights (optional)
): string {
    const month = new Date().toLocaleDateString('th-TH', { month: 'long', year: 'numeric' })

    let message = `🤖 DCA Plan - ${month}\n\n`
    message += `Portfolio: ${portfolioName}\n`
    message += `งบประจำเดือน: $${parseFloat(monthlyBudget).toFixed(2)}\n\n`
    message += `📊 แผนการลงทุนเดือนนี้:\n\n`

    for (const rec of recommendations) {
        message += `${rec.symbol}\n`
        message += `💵 จำนวน: $${parseFloat(rec.amount_usd).toFixed(2)} (${parseFloat(rec.weight).toFixed(1)}%)\n`
        message += `📈 ${rec.reason_text}\n`

        // Add AI insight if available
        const insight = insights?.find(i => i.symbol === rec.symbol)
        if (insight) {
            message += `\n💡 AI Analysis:\n`
            message += `${insight.insight}\n`
            if (insight.riskLevel !== 'low') {
                const riskEmoji = insight.riskLevel === 'high' ? '🔴' : '🟡'
                message += `${riskEmoji} Risk: ${insight.riskLevel.toUpperCase()}\n`
            }
        }

        message += `\n---\n\n`
    }

    const total = recommendations.reduce((sum, rec) => sum + parseFloat(rec.amount_usd), 0)
    message += `💰 Total: $${total.toFixed(2)}\n`
    message += `📅 Next calculation: ${getNextMonthDate()}\n`

    // Add disclaimer if AI insights were included
    if (insights && insights.length > 0) {
        message += `\n💡 AI insights are for context only.\n`
        message += `DCA weights calculated by MA50 algorithm.`
    }

    return message
}

function getNextMonthDate(): string {
    const next = new Date()
    next.setMonth(next.getMonth() + 1)
    next.setDate(1)
    return next.toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })
}

/**
 * Send message via LINE Messaging API
 */
async function sendLineMessage(
    lineUserId: string,
    message: string,
    accessToken: string
): Promise<boolean> {
    try {
        const response = await fetch('https://api.line.me/v2/bot/message/push', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify({
                to: lineUserId,
                messages: [
                    {
                        type: 'text',
                        text: message,
                    },
                ],
            }),
        })

        if (!response.ok) {
            const error = await response.json()
            throw new Error(`LINE API error: ${JSON.stringify(error)}`)
        }

        return true
    } catch (error) {
        console.error('Error sending LINE message:', error)
        return false
    }
}
