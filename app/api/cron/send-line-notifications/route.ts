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

                    // Format LINE message
                    const message = formatLineMessage(
                        portfolio.name,
                        monthName,
                        recommendations
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
 */
function formatLineMessage(
    portfolioName: string,
    monthName: string,
    recommendations: any[]
): string {
    const totalAmount = recommendations.reduce(
        (sum, rec) => sum + parseFloat(rec.amount_usd),
        0
    )

    let message = `📊 แผน DCA – ${monthName}\n`
    message += `📁 ${portfolioName}\n`
    message += `💰 งบรวม: $${totalAmount.toFixed(2)}\n\n`

    for (const rec of recommendations) {
        message += `${rec.symbol}: $${parseFloat(rec.amount_usd).toFixed(2)}\n`
        message += `เหตุผล: ${rec.reason_text}\n\n`
    }

    message += `✅ ซื้อได้วันที่ 2 ของเดือนนี้`

    return message
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
