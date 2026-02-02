'use client'

import { useState } from 'react'
import StockList from './StockList'
import AddStockForm from './AddStockForm'
import PerformanceComparison from './PerformanceComparison'
import { PortfolioStock } from '@/lib/types/database'

interface PortfolioTabsProps {
    portfolioId: string
    stocks: PortfolioStock[]
    totalWeight: number
}

export default function PortfolioTabs({ portfolioId, stocks, totalWeight }: PortfolioTabsProps) {
    const [activeTab, setActiveTab] = useState<'overview' | 'performance'>('overview')

    return (
        <div>
            {/* Tabs */}
            <div className="border-b border-gray-200 dark:border-gray-700 mb-8">
                <nav className="-mb-px flex space-x-8">
                    <button
                        onClick={() => setActiveTab('overview')}
                        className={`${activeTab === 'overview'
                                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                            } whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium`}
                    >
                        📊 Overview
                    </button>
                    <button
                        onClick={() => setActiveTab('performance')}
                        className={`${activeTab === 'performance'
                                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                            } whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium`}
                    >
                        📈 Performance
                    </button>
                </nav>
            </div>

            {/* Tab Content */}
            {activeTab === 'overview' ? (
                <>
                    {/* Weight Summary */}
                    {stocks.length > 0 && (
                        <div className="mb-6">
                            <div className={`p-4 rounded-lg ${Math.abs(totalWeight - 100) < 0.01
                                ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                                : 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800'
                                }`}>
                                <p className={`text-sm font-medium ${Math.abs(totalWeight - 100) < 0.01
                                    ? 'text-green-800 dark:text-green-200'
                                    : 'text-yellow-800 dark:text-yellow-200'
                                    }`}>
                                    Total Target Weight: {totalWeight.toFixed(2)}%
                                    {Math.abs(totalWeight - 100) < 0.01 ? ' ✓' : ` (should equal 100%)`}
                                </p>
                            </div>
                        </div>
                    )}

                    <div className="grid lg:grid-cols-3 gap-8">
                        {/* Stock List */}
                        <div className="lg:col-span-2">
                            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                                    Stocks in Portfolio
                                </h2>
                                <StockList portfolioId={portfolioId} stocks={stocks} />
                            </div>
                        </div>

                        {/* Add Stock Form */}
                        <div className="lg:col-span-1">
                            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 sticky top-8">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                                    Add Stock
                                </h2>
                                <AddStockForm portfolioId={portfolioId} />
                            </div>
                        </div>
                    </div>
                </>
            ) : (
                <PerformanceComparison portfolioId={portfolioId} />
            )}
        </div>
    )
}
