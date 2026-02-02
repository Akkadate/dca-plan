import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * Delete Portfolio API
 * DELETE /api/portfolio/[id]
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
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

        const portfolioId = params.id

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
