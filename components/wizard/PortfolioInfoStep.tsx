'use client'

import { useState } from 'react'

interface PortfolioInfoStepProps {
    initialData: {
        name: string
        budget: string
        market: 'US' | 'TH'
        objective: 'growth' | 'dividend' | 'capital_gain' | 'value' | 'balanced'
        risk_tolerance: 'low' | 'medium' | 'high'
        sectors: string[]
    }
    onSubmit: (data: any) => void
}

export default function PortfolioInfoStep({ initialData, onSubmit }: PortfolioInfoStepProps) {
    const [formData, setFormData] = useState(initialData)

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!formData.name || !formData.budget) {
            alert('Please fill in all required fields')
            return
        }
        onSubmit(formData)
    }

    const objectives = [
        { value: 'growth', label: '🚀 Growth', desc: 'High risk, high return potential' },
        { value: 'dividend', label: '💰 Dividend Income', desc: 'Steady passive income' },
        { value: 'capital_gain', label: '📈 Capital Gain', desc: 'Moderate growth' },
        { value: 'value', label: '🛡️ Value Investing', desc: 'Undervalued opportunities' },
        { value: 'balanced', label: '⚖️ Balanced', desc: 'Diversified mix' }
    ]

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                Portfolio Setup
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Portfolio Name */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Portfolio Name *
                    </label>
                    <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                        placeholder="My DCA Portfolio"
                        required
                    />
                </div>

                {/* Market Selection */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Market *
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                        <button
                            type="button"
                            onClick={() => setFormData({ ...formData, market: 'US' })}
                            className={`px-4 py-3 rounded-lg border-2 transition ${formData.market === 'US'
                                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                                    : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                                }`}
                        >
                            <div className="text-2xl mb-1">🇺🇸</div>
                            <div className="font-semibold">US Stocks</div>
                            <div className="text-xs text-gray-500">NYSE, NASDAQ</div>
                        </button>
                        <button
                            type="button"
                            onClick={() => setFormData({ ...formData, market: 'TH' })}
                            className={`px-4 py-3 rounded-lg border-2 transition ${formData.market === 'TH'
                                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                                    : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                                }`}
                        >
                            <div className="text-2xl mb-1">🇹🇭</div>
                            <div className="font-semibold">Thai Stocks</div>
                            <div className="text-xs text-gray-500">SET</div>
                        </button>
                    </div>
                </div>

                {/* Monthly Budget */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Monthly Budget * ({formData.market === 'US' ? 'USD' : 'THB'})
                    </label>
                    <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                            {formData.market === 'US' ? '$' : '฿'}
                        </span>
                        <input
                            type="number"
                            value={formData.budget}
                            onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                            className="w-full pl-8 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                            placeholder="500"
                            min="0"
                            step="0.01"
                            required
                        />
                    </div>
                </div>

                {/* Investment Objective */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Investment Objective *
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {objectives.map((obj) => (
                            <button
                                key={obj.value}
                                type="button"
                                onClick={() => setFormData({ ...formData, objective: obj.value as any })}
                                className={`px-4 py-3 rounded-lg border-2 text-left transition ${formData.objective === obj.value
                                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                                        : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                                    }`}
                            >
                                <div className="font-semibold text-gray-900 dark:text-white">{obj.label}</div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">{obj.desc}</div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Risk Tolerance */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Risk Tolerance *
                    </label>
                    <div className="grid grid-cols-3 gap-4">
                        {['low', 'medium', 'high'].map((risk) => (
                            <button
                                key={risk}
                                type="button"
                                onClick={() => setFormData({ ...formData, risk_tolerance: risk as any })}
                                className={`px-4 py-3 rounded-lg border-2 capitalize transition ${formData.risk_tolerance === risk
                                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                                        : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                                    }`}
                            >
                                {risk}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Submit */}
                <div className="flex justify-end pt-4">
                    <button
                        type="submit"
                        className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition"
                    >
                        Get AI Recommendations →
                    </button>
                </div>
            </form>
        </div>
    )
}
