'use client'

import { useState } from 'react'
import { StockRecommendation } from '@/lib/ai/portfolio-advisor'

interface StockCardProps {
    stock: StockRecommendation
    onRemove: () => void
    onWeightChange: (field: 'target' | 'min' | 'max', value: number) => void
}

export default function StockCard({ stock, onRemove, onWeightChange }: StockCardProps) {
    const [showReasoning, setShowReasoning] = useState(false)

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
                <div>
                    <div className="flex items-center space-x-3">
                        <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 font-mono font-bold rounded">
                            {stock.symbol}
                        </span>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {stock.name}
                        </h3>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        ${stock.current_price.toFixed(2)}
                    </p>
                </div>
                <button
                    onClick={onRemove}
                    className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                    title="Remove stock"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                {stock.metrics.pe_ratio && (
                    <div className="bg-gray-50 dark:bg-gray-900 p-2 rounded">
                        <div className="text-xs text-gray-500 dark:text-gray-400">P/E Ratio</div>
                        <div className="font-semibold text-gray-900 dark:text-white">{stock.metrics.pe_ratio.toFixed(2)}</div>
                    </div>
                )}
                {stock.metrics.dividend_yield !== null && (
                    <div className="bg-gray-50 dark:bg-gray-900 p-2 rounded">
                        <div className="text-xs text-gray-500 dark:text-gray-400">Dividend Yield</div>
                        <div className="font-semibold text-gray-900 dark:text-white">{stock.metrics.dividend_yield.toFixed(2)}%</div>
                    </div>
                )}
                <div className="bg-gray-50 dark:bg-gray-900 p-2 rounded">
                    <div className="text-xs text-gray-500 dark:text-gray-400">Market Cap</div>
                    <div className="font-semibold text-gray-900 dark:text-white">{stock.metrics.market_cap}</div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-900 p-2 rounded">
                    <div className="text-xs text-gray-500 dark:text-gray-400">52W High</div>
                    <div className="font-semibold text-gray-900 dark:text-white">${stock.metrics.week52_high.toFixed(2)}</div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-900 p-2 rounded">
                    <div className="text-xs text-gray-500 dark:text-gray-400">52W Low</div>
                    <div className="font-semibold text-gray-900 dark:text-white">${stock.metrics.week52_low.toFixed(2)}</div>
                </div>
                {stock.metrics.beta && (
                    <div className="bg-gray-50 dark:bg-gray-900 p-2 rounded">
                        <div className="text-xs text-gray-500 dark:text-gray-400">Beta</div>
                        <div className="font-semibold text-gray-900 dark:text-white">{stock.metrics.beta.toFixed(2)}</div>
                    </div>
                )}
            </div>

            {/* Weights */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mb-4">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">DCA Allocation Weights</h4>
                <div className="grid grid-cols-3 gap-3">
                    <div>
                        <label className="text-xs text-gray-500 dark:text-gray-400">Min %</label>
                        <input
                            type="number"
                            value={stock.weights.min}
                            onChange={(e) => onWeightChange('min', parseFloat(e.target.value))}
                            className="w-full mt-1 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
                            min="0"
                            max="100"
                            step="0.1"
                        />
                    </div>
                    <div>
                        <label className="text-xs text-gray-500 dark:text-gray-400">Target %</label>
                        <input
                            type="number"
                            value={stock.weights.target}
                            onChange={(e) => onWeightChange('target', parseFloat(e.target.value))}
                            className="w-full mt-1 px-2 py-1 border border-blue-500 rounded bg-blue-50 dark:bg-blue-900/20 text-gray-900 dark:text-white text-sm font-semibold"
                            min="0"
                            max="100"
                            step="0.1"
                        />
                    </div>
                    <div>
                        <label className="text-xs text-gray-500 dark:text-gray-400">Max %</label>
                        <input
                            type="number"
                            value={stock.weights.max}
                            onChange={(e) => onWeightChange('max', parseFloat(e.target.value))}
                            className="w-full mt-1 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
                            min="0"
                            max="100"
                            step="0.1"
                        />
                    </div>
                </div>
            </div>

            {/* AI Reasoning */}
            <button
                onClick={() => setShowReasoning(!showReasoning)}
                className="w-full text-left text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
                {showReasoning ? '▼' : '▶'} AI Reasoning
            </button>
            {showReasoning && (
                <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded text-sm text-gray-700 dark:text-gray-300">
                    {stock.reasoning}
                </div>
            )}
        </div>
    )
}
