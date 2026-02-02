'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface AddStockFormProps {
    portfolioId: string
}

export default function AddStockForm({ portfolioId }: AddStockFormProps) {
    const [symbol, setSymbol] = useState('')
    const [targetWeight, setTargetWeight] = useState('')
    const [minWeight, setMinWeight] = useState('')
    const [maxWeight, setMaxWeight] = useState('')
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const router = useRouter()
    const supabase = createClient()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        setLoading(true)

        try {
            const target = parseFloat(targetWeight)
            const min = parseFloat(minWeight)
            const max = parseFloat(maxWeight)

            // Validation
            if (isNaN(target) || isNaN(min) || isNaN(max)) {
                throw new Error('Please enter valid numbers for all weight fields')
            }

            if (min < 0 || max > 100) {
                throw new Error('Weights must be between 0 and 100')
            }

            if (min > target || target > max) {
                throw new Error('Min ≤ Target ≤ Max weight required')
            }

            if (!symbol.trim()) {
                throw new Error('Please enter a stock symbol')
            }

            // Insert stock
            const { error } = await supabase
                .from('portfolio_stocks')
                .insert({
                    portfolio_id: portfolioId,
                    symbol: symbol.toUpperCase().trim(),
                    target_weight: target,
                    min_weight: min,
                    max_weight: max,
                })

            if (error) {
                if (error.code === '23505') {
                    throw new Error('This stock symbol already exists in the portfolio')
                }
                throw error
            }

            // Reset form
            setSymbol('')
            setTargetWeight('')
            setMinWeight('')
            setMaxWeight('')

            router.refresh()
        } catch (error: any) {
            setError(error.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
                <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm">
                    {error}
                </div>
            )}

            <div>
                <label htmlFor="symbol" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Stock Symbol
                </label>
                <input
                    id="symbol"
                    type="text"
                    value={symbol}
                    onChange={(e) => setSymbol(e.target.value)}
                    required
                    placeholder="AAPL"
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-sm"
                />
            </div>

            <div>
                <label htmlFor="targetWeight" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Target Weight (%)
                </label>
                <input
                    id="targetWeight"
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={targetWeight}
                    onChange={(e) => setTargetWeight(e.target.value)}
                    required
                    placeholder="25.0"
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-sm"
                />
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label htmlFor="minWeight" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Min (%)
                    </label>
                    <input
                        id="minWeight"
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        value={minWeight}
                        onChange={(e) => setMinWeight(e.target.value)}
                        required
                        placeholder="15.0"
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-sm"
                    />
                </div>
                <div>
                    <label htmlFor="maxWeight" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Max (%)
                    </label>
                    <input
                        id="maxWeight"
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        value={maxWeight}
                        onChange={(e) => setMaxWeight(e.target.value)}
                        required
                        placeholder="35.0"
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-sm"
                    />
                </div>
            </div>

            <p className="text-xs text-gray-500 dark:text-gray-400">
                Weights must satisfy: Min ≤ Target ≤ Max
            </p>

            <button
                type="submit"
                disabled={loading}
                className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-lg transition text-sm"
            >
                {loading ? 'Adding...' : 'Add Stock'}
            </button>
        </form>
    )
}
