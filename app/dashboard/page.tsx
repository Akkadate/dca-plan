import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function DashboardPage() {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Fetch user's portfolios with stock count
    const { data: portfolios } = await supabase
        .from('portfolios')
        .select(`
            *,
            portfolio_stocks (count)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Header */}
            <header className="bg-white dark:bg-gray-800 shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex justify-between items-center">
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                            DCA Dashboard
                        </h1>
                        <div className="flex items-center space-x-4">
                            <Link
                                href="/history"
                                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition"
                            >
                                History
                            </Link>
                            <Link
                                href="/settings"
                                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition"
                            >
                                Settings
                            </Link>
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                                {user.email}
                            </span>
                            <form action="/api/auth/signout" method="post">
                                <button
                                    type="submit"
                                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition"
                                >
                                    Sign Out
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Welcome Banner - Show only if no portfolios */}
                {(!portfolios || portfolios.length === 0) && (
                    <div className="mb-8">
                        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
                            <h2 className="text-xl font-semibold text-blue-900 dark:text-blue-100 mb-2">
                                🎉 Welcome to DCA Plan!
                            </h2>
                            <p className="text-blue-700 dark:text-blue-300 mb-4">
                                Get started by creating your first portfolio and adding stocks to begin your DCA journey.
                            </p>
                            <Link
                                href="/portfolio/create"
                                className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition"
                            >
                                Create Portfolio
                            </Link>
                        </div>
                    </div>
                )}

                {/* Portfolios Section */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                            My Portfolios
                        </h2>
                        <div className="flex gap-3">
                            <Link
                                href="/portfolio/create-ai"
                                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold rounded-lg transition text-sm flex items-center space-x-2"
                            >
                                <span>🤖</span>
                                <span>Create with AI</span>
                            </Link>
                            <Link
                                href="/portfolio/create"
                                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg transition text-sm"
                            >
                                + Manual
                            </Link>
                        </div>
                    </div>

                    {!portfolios || portfolios.length === 0 ? (
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
                                    d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                                />
                            </svg>
                            <p className="text-lg">No portfolios yet</p>
                            <p className="text-sm mt-2">Create your first portfolio to get started</p>
                        </div>
                    ) : (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {portfolios.map((portfolio: any) => {
                                const stockCount = portfolio.portfolio_stocks?.[0]?.count || 0
                                return (
                                    <Link
                                        key={portfolio.id}
                                        href={`/portfolio/${portfolio.id}`}
                                        className="block p-6 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-lg hover:border-blue-500 dark:hover:border-blue-400 transition"
                                    >
                                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                                            {portfolio.name}
                                        </h3>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-gray-600 dark:text-gray-400">Monthly Budget:</span>
                                                <span className="font-semibold text-gray-900 dark:text-white">
                                                    ${parseFloat(portfolio.monthly_budget).toFixed(2)}
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600 dark:text-gray-400">Stocks:</span>
                                                <span className="font-semibold text-gray-900 dark:text-white">
                                                    {stockCount}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="mt-4 text-blue-600 dark:text-blue-400 text-sm font-medium">
                                            View Details →
                                        </div>
                                    </Link>
                                )
                            })}
                        </div>
                    )}
                </div>
            </main>
        </div>
    )
}
