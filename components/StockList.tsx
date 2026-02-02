'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PortfolioStock } from '@/lib/types/database'

interface StockListProps {
    portfolioId: string
    stocks: PortfolioStock[]
}

export default function StockList({ portfolioId, stocks }: StockListProps) {
    const [deleting, setDeleting] = useState<string | null>(null)
    const [editing, setEditing] = useState<string | null>(null)
    const [editSymbol, setEditSymbol] = useState('')
    const router = useRouter()

    const handleDelete = async (stockId: string) => {
        if (!confirm('Are you sure you want to remove this stock?')) return

        setDeleting(stockId)
        try {
            const response = await fetch(`/api/stock/${stockId}`, {
                method: 'DELETE',
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || 'Failed to delete stock')
            }

            router.refresh()
        } catch (error: any) {
            alert('Error deleting stock: ' + error.message)
        } finally {
            setDeleting(null)
        }
    }

    const startEdit = (stock: PortfolioStock) => {
        setEditing(stock.id)
        setEditSymbol(stock.symbol)
    }

    const cancelEdit = () => {
        setEditing(null)
        setEditSymbol('')
    }

    const saveEdit = async (stockId: string) => {
        if (!editSymbol.trim()) {
            alert('Symbol cannot be empty')
            return
        }

        try {
            const response = await fetch(`/api/stock/${stockId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ symbol: editSymbol }),
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || 'Failed to update stock')
            }

            setEditing(null)
            setEditSymbol('')
            router.refresh()
        } catch (error: any) {
            alert('Error updating stock: ' + error.message)
        }
    }

    if (stocks.length === 0) {
        return (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                <svg
                    className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600 mb-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                </svg>
                <p className="text-lg">No stocks added yet</p>
                <p className="text-sm mt-2">Add your first stock to start DCA planning</p>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {stocks.map((stock) => (
                <div
                    key={stock.id}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition"
                >
                    <div className="flex justify-between items-start">
                        <div className="flex-1">
                            {editing === stock.id ? (
                                <div className="flex items-center gap-2 mb-2">
                                    <input
                                        type="text"
                                        value={editSymbol}
                                        onChange={(e) => setEditSymbol(e.target.value.toUpperCase())}
                                        className="text-xl font-bold px-2 py-1 border border-blue-500 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                        autoFocus
                                    />
                                    <button
                                        onClick={() => saveEdit(stock.id)}
                                        className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded"
                                    >
                                        ✓
                                    </button>
                                    <button
                                        onClick={cancelEdit}
                                        className="px-3 py-1 bg-gray-500 hover:bg-gray-600 text-white text-sm rounded"
                                    >
                                        ✕
                                    </button>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 mb-2">
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                        {stock.symbol.toUpperCase()}
                                    </h3>
                                    <button
                                        onClick={() => startEdit(stock)}
                                        className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm"
                                        title="Edit symbol"
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
                            )}
                            <div className="grid grid-cols-3 gap-4 text-sm">
                                <div>
                                    <span className="text-gray-500 dark:text-gray-400">Target:</span>
                                    <span className="ml-2 font-semibold text-gray-900 dark:text-white">
                                        {parseFloat(stock.target_weight.toString()).toFixed(1)}%
                                    </span>
                                </div>
                                <div>
                                    <span className="text-gray-500 dark:text-gray-400">Min:</span>
                                    <span className="ml-2 font-semibold text-gray-900 dark:text-white">
                                        {parseFloat(stock.min_weight.toString()).toFixed(1)}%
                                    </span>
                                </div>
                                <div>
                                    <span className="text-gray-500 dark:text-gray-400">Max:</span>
                                    <span className="ml-2 font-semibold text-gray-900 dark:text-white">
                                        {parseFloat(stock.max_weight.toString()).toFixed(1)}%
                                    </span>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={() => handleDelete(stock.id)}
                            disabled={deleting === stock.id}
                            className="ml-4 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50"
                            title="Remove stock"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                            </svg>
                        </button>
                    </div>
                </div>
            ))}
        </div>
    )
}
