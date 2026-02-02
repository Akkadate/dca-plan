'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface DeletePortfolioButtonProps {
    portfolioId: string
    portfolioName: string
}

export default function DeletePortfolioButton({ portfolioId, portfolioName }: DeletePortfolioButtonProps) {
    const [deleting, setDeleting] = useState(false)
    const router = useRouter()

    const handleDelete = async () => {
        if (!confirm(`Are you sure you want to delete "${portfolioName}"? This will remove all stocks and recommendations. This action cannot be undone.`)) {
            return
        }

        setDeleting(true)
        try {
            const response = await fetch(`/api/portfolio/${portfolioId}`, {
                method: 'DELETE',
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || 'Failed to delete portfolio')
            }

            // Redirect to dashboard
            router.push('/dashboard')
            router.refresh()
        } catch (error: any) {
            alert('Error deleting portfolio: ' + error.message)
            setDeleting(false)
        }
    }

    return (
        <button
            onClick={handleDelete}
            disabled={deleting}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-semibold rounded-lg transition text-sm"
        >
            {deleting ? 'Deleting...' : 'Delete Portfolio'}
        </button>
    )
}
