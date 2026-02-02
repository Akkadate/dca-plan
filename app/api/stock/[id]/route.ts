import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * Update/Delete Stock API
 * PATCH /api/stock/[id] - Update stock symbol
 * DELETE /api/stock/[id] - Delete stock
 */

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: stockId } = await params
        const body = await request.json()
        const { symbol } = body

        if (!symbol || !symbol.trim()) {
            return NextResponse.json(
                { error: 'Symbol is required' },
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

        // Update stock symbol
        const { error } = await supabase
            .from('portfolio_stocks')
            .update({ symbol: symbol.toUpperCase().trim() })
            .eq('id', stockId)

        if (error) {
            throw error
        }

        return NextResponse.json({
            success: true,
            message: 'Stock updated successfully'
        })
    } catch (error: any) {
        console.error('Error updating stock:', error)
        return NextResponse.json(
            { error: error.message || 'Failed to update stock' },
            { status: 500 }
        )
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: stockId } = await params

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

        // Delete stock
        const { error } = await supabase
            .from('portfolio_stocks')
            .delete()
            .eq('id', stockId)

        if (error) {
            throw error
        }

        return NextResponse.json({
            success: true,
            message: 'Stock deleted successfully'
        })
    } catch (error: any) {
        console.error('Error deleting stock:', error)
        return NextResponse.json(
            { error: error.message || 'Failed to delete stock' },
            { status: 500 }
        )
    }
}
