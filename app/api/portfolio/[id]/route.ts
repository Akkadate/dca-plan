import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * Update Portfolio API
 * PATCH /api/portfolio/[id]
 */
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: portfolioId } = await params
        const body = await request.json()
        const { monthly_budget } = body

        if (!monthly_budget || monthly_budget <= 0) {
            return NextResponse.json(
                { error: 'Monthly budget must be greater than 0' },
                { status: 400 }
            )
        }

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

        // Update portfolio budget
        const { error } = await supabase
            .from('portfolios')
            .update({ monthly_budget })
            .eq('id', portfolioId)

        if (error) {
            throw error
        }

        return NextResponse.json({
            success: true,
            message: 'Budget updated successfully'
        })
    } catch (error: any) {
        console.error('Error updating budget:', error)
        return NextResponse.json(
            { error: error.message || 'Failed to update budget' },
            { status: 500 }
        )
    }
}

export async function DELETE(
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

        // Delete portfolio (cascade will handle related records due to DB constraints)
        const { error } = await supabase
            .from('portfolios')
            .delete()
            .eq('id', portfolioId)

        if (error) {
            throw error
        }

        return NextResponse.json({
            success: true,
            message: 'Portfolio deleted successfully'
        })
    } catch (error: any) {
        console.error('Error deleting portfolio:', error)
        return NextResponse.json(
            { error: error.message || 'Failed to delete portfolio' },
            { status: 500 }
        )
    }
}
