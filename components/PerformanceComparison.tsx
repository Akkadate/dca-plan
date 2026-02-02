'use client'

import { useEffect, useState } from 'react'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { ComparisonResult } from '@/lib/backtest/calculator'

interface PerformanceComparisonProps {
    portfolioId: string
}

export default function PerformanceComparison({ portfolioId }: PerformanceComparisonProps) {
    const [data, setData] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        fetchPerformance()
    }, [portfolioId])

    const fetchPerformance = async () => {
        try {
            setLoading(true)
            const response = await fetch(`/api/portfolio/${portfolioId}/performance`)
            const result = await response.json()

            if (!response.ok) {
                throw new Error(result.error || result.message || 'Failed to fetch performance')
            }

            setData(result)
            setError(null)
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <span className="ml-4 text-gray-600 dark:text-gray-400">Calculating performance...</span>
            </div>
        )
    }

    if (error) {
        return (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
                    {error.includes('No recommendations') ? 'ยังไม่มีข้อมูลเพียงพอ' : 'เกิดข้อผิดพลาด'}
                </h3>
                <p className="text-yellow-700 dark:text-yellow-300">
                    {error.includes('No recommendations')
                        ? 'ต้องมีข้อมูล DCA อย่างน้อย 1 เดือนเพื่อคำนวณผลตอบแทน กรุณารัน "Calculate DCA" ในหน้า Test ก่อน'
                        : error
                    }
                </p>
            </div>
        )
    }

    const { comparison, metadata } = data
    const { smartDCA, equalDCA, difference } = comparison as ComparisonResult

    // Prepare chart data
    const summaryData = [
        {
            name: 'Smart DCA',
            'Total Invested': smartDCA.totalInvested,
            'Current Value': smartDCA.currentValue,
        },
        {
            name: 'Equal DCA',
            'Total Invested': equalDCA.totalInvested,
            'Current Value': equalDCA.currentValue,
        }
    ]

    const returnData = [
        { strategy: 'Smart DCA', return: smartDCA.returnPct },
        { strategy: 'Equal DCA', return: equalDCA.returnPct }
    ]

    // Monthly performance trend
    const monthlyTrend = smartDCA.monthlyDetails.map((smart, idx) => ({
        month: smart.month,
        smartValue: smart.valueAtMonth,
        equalValue: equalDCA.monthlyDetails[idx]?.valueAtMonth || 0,
        smartReturn: smart.cumulativeReturn,
        equalReturn: equalDCA.monthlyDetails[idx]?.cumulativeReturn || 0
    }))

    return (
        <div className="space-y-8">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">ลงทุนไปทั้งหมด</h3>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">
                        ${smartDCA.totalInvested.toFixed(2)}
                    </p>
                </div>

                <div className={`bg-white dark:bg-gray-800 rounded-lg shadow p-6 ${difference.valueDiff > 0 ? 'ring-2 ring-green-500' : ''}`}>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                        Smart DCA ผลตอบแทน
                    </h3>
                    <p className={`text-3xl font-bold ${smartDCA.returnPct >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {smartDCA.returnPct >= 0 ? '+' : ''}{smartDCA.returnPct.toFixed(2)}%
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        ${smartDCA.currentValue.toFixed(2)}
                    </p>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                        Equal DCA ผลตอบแทน
                    </h3>
                    <p className={`text-3xl font-bold ${equalDCA.returnPct >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {equalDCA.returnPct >= 0 ? '+' : ''}{equalDCA.returnPct.toFixed(2)}%
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        ${equalDCA.currentValue.toFixed(2)}
                    </p>
                </div>
            </div>

            {/* Winner Banner */}
            {difference.returnDiff !== 0 && (
                <div className={`${difference.returnDiff > 0 ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'} border rounded-lg p-4`}>
                    <p className={`text-lg font-semibold ${difference.returnDiff > 0 ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'}`}>
                        {difference.returnDiff > 0 ? '🎉 Smart DCA ชนะ!' : '⚠️ Equal DCA ดีกว่า'}
                    </p>
                    <p className={`text-sm ${difference.returnDiff > 0 ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
                        {difference.returnDiff > 0 ? 'ดีกว่า' : 'แย่กว่า'} {Math.abs(difference.returnDiff).toFixed(2)}%
                        ({difference.valueDiff > 0 ? '+' : ''}${difference.valueDiff.toFixed(2)})
                    </p>
                </div>
            )}

            {/* Return Comparison Chart */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">เปรียบเทียบผลตอบแทน (%)</h3>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={returnData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="strategy" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="return" fill="#3b82f6" />
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* Value Over Time */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">มูลค่าพอร์ตตามเวลา</h3>
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={monthlyTrend}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="smartValue" stroke="#10b981" name="Smart DCA" strokeWidth={2} />
                        <Line type="monotone" dataKey="equalValue" stroke="#6b7280" name="Equal DCA" strokeWidth={2} />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            {/* Metadata */}
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 text-sm text-gray-600 dark:text-gray-400">
                <p>📊 วิเคราะห์: {metadata.months_analyzed} เดือน ({metadata.oldest_month} ถึง {metadata.latest_month})</p>
                <p>📈 หุ้น: {metadata.symbols.join(', ')}</p>
            </div>
        </div>
    )
}
