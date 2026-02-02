'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface EditBudgetProps {
    portfolioId: string
    currentBudget: number
}

export default function EditBudget({ portfolioId, currentBudget }: EditBudgetProps) {
    const [editing, setEditing] = useState(false)
    const [budget, setBudget] = useState(currentBudget.toString())
    const [saving, setSaving] = useState(false)
    const router = useRouter()

    const handleSave = async () => {
        const budgetNum = parseFloat(budget)

        if (isNaN(budgetNum) || budgetNum <= 0) {
            alert('กรุณาใส่งบประมาณที่มากกว่า 0')
            return
        }

        setSaving(true)
        try {
            const response = await fetch(`/api/portfolio/${portfolioId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ monthly_budget: budgetNum }),
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || 'Failed to update budget')
            }

            setEditing(false)
            router.refresh()
        } catch (error: any) {
            alert('Error updating budget: ' + error.message)
        } finally {
            setSaving(false)
        }
    }

    const handleCancel = () => {
        setBudget(currentBudget.toString())
        setEditing(false)
    }

    if (editing) {
        return (
            <div className="flex items-center gap-2">
                <span className="text-gray-600 dark:text-gray-400">Monthly Budget: $</span>
                <input
                    type="number"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    className="px-2 py-1 border border-blue-500 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white w-32"
                    autoFocus
                    min="0"
                    step="0.01"
                />
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-3 py-1 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white text-sm rounded"
                >
                    {saving ? '...' : '✓'}
                </button>
                <button
                    onClick={handleCancel}
                    disabled={saving}
                    className="px-3 py-1 bg-gray-500 hover:bg-gray-600 text-white text-sm rounded"
                >
                    ✕
                </button>
            </div>
        )
    }

    return (
        <div className="flex items-center gap-2">
            <span className="text-gray-600 dark:text-gray-400">
                Monthly Budget: ${currentBudget.toFixed(2)}
            </span>
            <button
                onClick={() => setEditing(true)}
                className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm"
                title="Edit budget"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                </svg>
            </button>
        </div>
    )
}
