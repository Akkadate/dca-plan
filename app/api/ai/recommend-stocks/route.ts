import { NextRequest, NextResponse } from 'next/server'
import { getStockRecommendations, PortfolioObjective } from '@/lib/ai/portfolio-advisor'

/**
 * AI Stock Recommendation API
 * POST /api/ai/recommend-stocks
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

        // Get AI recommendations
        const recommendations = await getStockRecommendations({
            market,
            objective,
            risk_tolerance,
            budget,
            sectors: sectors || []
        })

        return NextResponse.json({
            success: true,
            ...recommendations
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
