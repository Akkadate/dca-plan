'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import PortfolioInfoStep from '@/components/wizard/PortfolioInfoStep'
import AIThinkingStep from '@/components/wizard/AIThinkingStep'
import RecommendationsStep from '@/components/wizard/RecommendationsStep'
import { PortfolioRecommendation } from '@/lib/ai/portfolio-advisor'

export default function CreateAIPortfolioPage() {
    const router = useRouter()
    const [step, setStep] = useState(1)
    const [formData, setFormData] = useState({
        name: '',
        budget: '',
        market: 'US' as 'US' | 'TH',
        objective: 'growth' as 'growth' | 'dividend' | 'capital_gain' | 'value' | 'balanced',
        risk_tolerance: 'medium' as 'low' | 'medium' | 'high',
        sectors: [] as string[]
    })
    const [recommendations, setRecommendations] = useState<PortfolioRecommendation | null>(null)
    const [error, setError] = useState<string | null>(null)

    const handleStep1Submit = async (data: typeof formData) => {
        setFormData(data)
        setStep(2)
        setError(null)

        // Call AI API
        try {
            const response = await fetch('/api/ai/recommend-stocks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    market: data.market,
                    objective: data.objective,
                    risk_tolerance: data.risk_tolerance,
                    budget: parseFloat(data.budget),
                    sectors: data.sectors
                })
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || 'Failed to get recommendations')
            }

            const result = await response.json()
            setRecommendations(result)
            setStep(3)
        } catch (err: any) {
            setError(err.message)
            setStep(1)
        }
    }

    const handleCreatePortfolio = async (finalStocks: any[]) => {
        try {
            // Create portfolio
            const response = await fetch('/api/portfolio', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formData.name,
                    monthly_budget: parseFloat(formData.budget),
                    stocks: finalStocks
                })
            })

            if (!response.ok) {
                throw new Error('Failed to create portfolio')
            }

            const { portfolio } = await response.json()
            router.push(`/portfolio/${portfolio.id}`)
        } catch (err: any) {
            alert('Error creating portfolio: ' + err.message)
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                        🤖 AI Portfolio Wizard
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Let AI help you build the perfect DCA portfolio
                    </p>
                </div>

                {/* Progress */}
                <div className="mb-12">
                    <div className="flex items-center justify-center space-x-4">
                        {[1, 2, 3].map((s) => (
                            <div key={s} className="flex items-center">
                                <div className={`flex items-center justify-center w-10 h-10 rounded-full ${step >= s
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-300 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                                    }`}>
                                    {s}
                                </div>
                                {s < 3 && (
                                    <div className={`w-16 h-1 ${step > s ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-700'
                                        }`} />
                                )}
                            </div>
                        ))}
                    </div>
                    <div className="flex items-center justify-center space-x-20 mt-2">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Setup</span>
                        <span className="text-sm text-gray-600 dark:text-gray-400">AI Analysis</span>
                        <span className="text-sm text-gray-600 dark:text-gray-400">Review</span>
                    </div>
                </div>

                {/* Error */}
                {error && (
                    <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                        <p className="text-red-800 dark:text-red-200">{error}</p>
                    </div>
                )}

                {/* Steps */}
                {step === 1 && (
                    <PortfolioInfoStep
                        initialData={formData}
                        onSubmit={handleStep1Submit}
                    />
                )}

                {step === 2 && <AIThinkingStep />}

                {step === 3 && recommendations && (
                    <RecommendationsStep
                        formData={formData}
                        recommendations={recommendations}
                        onCreatePortfolio={handleCreatePortfolio}
                        onBack={() => setStep(1)}
                    />
                )}
            </div>
        </div>
    )
}
