import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function HistoryPage() {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Get user's portfolios
    const { data: portfolios } = await supabase
        .from('portfolios')
        .select('id, name')
        .eq('user_id', user.id)

    const portfolioIds = portfolios?.map(p => p.id) || []

    // Get all recommendations for user's portfolios
    const { data: recommendations } = await supabase
        .from('dca_recommendations')
        .select(`
      *,
      portfolios:portfolio_id (
        id,
        name,
        monthly_budget
      )
    `)
        .in('portfolio_id', portfolioIds)
        .order('month', { ascending: false })
        .order('amount_usd', { ascending: false })

    // Group by month
    const groupedByMonth: Record<string, any[]> = {}
    recommendations?.forEach(rec => {
        if (!groupedByMonth[rec.month]) {
            groupedByMonth[rec.month] = []
        }
        groupedByMonth[rec.month].push(rec)
    })

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Header */}
            <header className="bg-white dark:bg-gray-800 shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <Link
                                href="/dashboard"
                                className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 mb-2 inline-block"
                            >
                                ← Back to Dashboard
                            </Link>
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                                DCA History
                            </h1>
                        </div>
                        <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                                {user.email}
                            </span>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {Object.keys(groupedByMonth).length === 0 ? (
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
                        <svg
                            className="mx-auto h-16 w-16 text-gray-400 dark:text-gray-600 mb-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                            />
                        </svg>
                        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
                            No Recommendations Yet
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">
                            DCA recommendations will appear here after the monthly calculation runs.
                        </p>
                        <Link
                            href="/dashboard"
                            className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition"
                        >
                            Go to Dashboard
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-8">
                        {Object.entries(groupedByMonth).map(([month, recs]) => {
                            const monthDate = new Date(month + '-01')
                            const monthName = monthDate.toLocaleDateString('en-US', {
                                month: 'long',
                                year: 'numeric',
                            })

                            // Group by portfolio
                            const byPortfolio: Record<string, any[]> = {}
                            recs.forEach(rec => {
                                const portfolioId = rec.portfolios?.id
                                if (!byPortfolio[portfolioId]) {
                                    byPortfolio[portfolioId] = []
                                }
                                byPortfolio[portfolioId].push(rec)
                            })

                            return (
                                <div key={month} className="bg-white dark:bg-gray-800 rounded-lg shadow">
                                    <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                                            {monthName}
                                        </h2>
                                    </div>

                                    <div className="p-6 space-y-6">
                                        {Object.entries(byPortfolio).map(([portfolioId, portfolioRecs]) => {
                                            const portfolio = portfolioRecs[0]?.portfolios
                                            const totalAmount = portfolioRecs.reduce(
                                                (sum, rec) => sum + parseFloat(rec.amount_usd),
                                                0
                                            )

                                            return (
                                                <div key={portfolioId}>
                                                    <div className="mb-4">
                                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                                            {portfolio?.name}
                                                        </h3>
                                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                                            Total: ${totalAmount.toFixed(2)}
                                                        </p>
                                                    </div>

                                                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                        {portfolioRecs.map(rec => (
                                                            <div
                                                                key={rec.id}
                                                                className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                                                            >
                                                                <div className="flex justify-between items-start mb-2">
                                                                    <h4 className="text-xl font-bold text-gray-900 dark:text-white">
                                                                        {rec.symbol}
                                                                    </h4>
                                                                    <span className="text-sm text-gray-500 dark:text-gray-400">
                                                                        {parseFloat(rec.weight).toFixed(1)}%
                                                                    </span>
                                                                </div>
                                                                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-3">
                                                                    ${parseFloat(rec.amount_usd).toFixed(2)}
                                                                </div>
                                                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                                                    {rec.reason_text}
                                                                </p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </main>
        </div>
    )
}
