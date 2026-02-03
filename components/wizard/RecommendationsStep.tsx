'use client'

import { useState } from 'react'
import { PortfolioRecommendation, StockRecommendation } from '@/lib/ai/portfolio-advisor'
import StockCard from './StockCard'

interface RecommendationsStepProps {
    formData: any
    recommendations: PortfolioRecommendation
    onCreatePortfolio: (stocks: any[]) => void
    onBack: () => void
}

export default function RecommendationsStep({
    formData,
    recommendations,
    onCreatePortfolio,
    onBack
}: RecommendationsStepProps) {
    const [stocks, setStocks] = useState<StockRecommendation[]>(recommendations.recommendations)
    const [creating, setCreating] = useState(false)

    const handleRemoveStock = (symbol: string) => {
        setStocks(stocks.filter(s => s.symbol !== symbol))
    }

    const handleWeightChange = (symbol: string, field: 'target' | 'min' | 'max', value: number) => {
        setStocks(stocks.map(s =>
            s.symbol === symbol
                ? { ...s, weights: { ...s.weights, [field]: value } }
                : s
        ))
    }

    const handleCreate = () => {
        // Convert to format expected by API
        const stockData = stocks.map(s => ({
            symbol: s.symbol,
            target_weight: s.weights.target,
            min_weight: s.weights.min,
            max_weight: s.weights.max
        }))

        setCreating(true)
        onCreatePortfolio(stockData)
    }

    const totalWeight = stocks.reduce((sum, s) => sum + s.weights.target, 0)
    const isWeightValid = Math.abs(totalWeight - 100) < 0.1

    return (
        <div className="space-y-6">
            {/* Portfolio Summary */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg shadow-lg p-6 text-white">
                <h2 className="text-2xl font-bold mb-4">
                    AI Recommendation Summary
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                        <div className="text-sm opacity-90">Risk Level</div>
                        <div className="text-xl font-bold">{recommendations.portfolio_summary.risk_level}</div>
                    </div>
                    <div>
                        <div className="text-sm opacity-90">Expected Return</div>
                        <div className="text-xl font-bold">{recommendations.portfolio_summary.expected_return}</div>
                    </div>
                    <div>
                        <div className="text-sm opacity-90">Diversification</div>
                        <div className="text-xl font-bold">{recommendations.portfolio_summary.diversification_score}/10</div>
                    </div>
                    <div>
                        <div className="text-sm opacity-90">Total Stocks</div>
                        <div className="text-xl font-bold">{stocks.length}</div>
                    </div>
                </div>
            </div>

            {/* Weight Validation */}
            <div className={`p-4 rounded-lg border-2 ${isWeightValid
                    ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                    : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
                }`}>
                <p className={`font-medium ${isWeightValid
                        ? 'text-green-800 dark:text-green-200'
                        : 'text-yellow-800 dark:text-yellow-200'
                    }`}>
                    Total Weight: {totalWeight.toFixed(1)}%
                    {isWeightValid ? ' ✓' : ' (must equal 100%)'}
                </p>
            </div>

            {/* Stock Cards */}
            <div className="space-y-4">
                {stocks.map((stock) => (
                    <StockCard
                        key={stock.symbol}
                        stock={stock}
                        onRemove={() => handleRemoveStock(stock.symbol)}
                        onWeightChange={(field, value) => handleWeightChange(stock.symbol, field, value)}
                    />
                ))}
            </div>

            {/* Actions */}
            <div className="flex justify-between pt-4">
                <button
                    onClick={onBack}
                    className="px-6 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                >
                    ← Start Over
                </button>
                <button
                    onClick={handleCreate}
                    disabled={!isWeightValid || creating || stocks.length === 0}
                    className="px-8 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold rounded-lg transition"
                >
                    {creating ? 'Creating...' : 'Create Portfolio ✓'}
                </button>
            </div>
        </div>
    )
}
