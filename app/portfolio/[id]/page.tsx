import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import DeletePortfolioButton from '@/components/DeletePortfolioButton'
import PortfolioTabs from '@/components/PortfolioTabs'

export default async function PortfolioDetailPage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Fetch portfolio with stocks
    const { data: portfolio, error } = await supabase
        .from('portfolios')
        .select(`
      *,
      portfolio_stocks (*)
    `)
        .eq('id', id)
        .single()

    if (error || !portfolio) {
        notFound()
    }

    const totalWeight = portfolio.portfolio_stocks.reduce(
        (sum: number, stock: any) => sum + parseFloat(stock.target_weight),
        0
    )

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Header */}
            <header className="bg-white dark:bg-gray-800 shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <Link
                                href="/dashboard"
                                className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 mb-2 inline-block"
                            >
                                ← Back to Dashboard
                            </Link>
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                                {portfolio.name}
                            </h1>
                            <p className="text-gray-600 dark:text-gray-400 mt-1">
                                Monthly Budget: ${parseFloat(portfolio.monthly_budget).toFixed(2)}
                            </p>
                        </div>
                        <div className="flex items-center space-x-4">
                            <DeletePortfolioButton
                                portfolioId={id}
                                portfolioName={portfolio.name}
                            />
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                                {user.email}
                            </span>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <PortfolioTabs
                    portfolioId={id}
                    stocks={portfolio.portfolio_stocks}
                    totalWeight={totalWeight}
                />
            </main>
        </div>
    )
}
