import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { PortfolioWithStocks } from '@/lib/types/database'
import StockList from '@/components/StockList'
import AddStockForm from '@/components/AddStockForm'
import DeletePortfolioButton from '@/components/DeletePortfolioButton'

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
                {/* Weight Summary */}
                {portfolio.portfolio_stocks.length > 0 && (
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
                            <StockList portfolioId={id} stocks={portfolio.portfolio_stocks} />
                        </div>
                    </div>

                    {/* Add Stock Form */}
                    <div className="lg:col-span-1">
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 sticky top-8">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                                Add Stock
                            </h2>
                            <AddStockForm portfolioId={id} />
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}
