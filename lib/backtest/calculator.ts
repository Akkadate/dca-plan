import { StockPrice } from '../types/database'

export interface BacktestResult {
    totalInvested: number
    currentValue: number
    returnPct: number
    monthlyDetails: MonthlyPerformance[]
}

export interface MonthlyPerformance {
    month: string
    invested: number
    sharesAccumulated: { [symbol: string]: number }
    valueAtMonth: number
    cumulativeReturn: number
}

export interface ComparisonResult {
    smartDCA: BacktestResult
    equalDCA: BacktestResult
    difference: {
        valueDiff: number
        returnDiff: number
    }
}

interface Recommendation {
    symbol: string
    amount_usd: number
    month: string
}

interface StockPriceMap {
    [symbol: string]: StockPrice[]
}

/**
 * Calculate performance for Smart DCA strategy
 */
export function calculateSmartDCAPerformance(
    recommendations: Recommendation[],
    priceData: StockPriceMap,
    buyDayOfMonth: number = 2
): BacktestResult {
    const monthlyDetails: MonthlyPerformance[] = []
    const sharesAccumulated: { [symbol: string]: number } = {}
    let totalInvested = 0

    // Group recommendations by month
    const monthlyRecs = groupByMonth(recommendations)

    for (const [month, recs] of Object.entries(monthlyRecs)) {
        const buyDate = getBuyDate(month, buyDayOfMonth)
        let monthInvested = 0

        // Buy shares for each recommendation
        for (const rec of recs) {
            const price = getPriceAtDate(priceData[rec.symbol], buyDate)
            if (price) {
                const shares = rec.amount_usd / price
                sharesAccumulated[rec.symbol] = (sharesAccumulated[rec.symbol] || 0) + shares
                monthInvested += rec.amount_usd
            }
        }

        totalInvested += monthInvested

        // Calculate value at this month (using latest available price)
        const valueAtMonth = calculateCurrentValue(sharesAccumulated, priceData, buyDate)

        monthlyDetails.push({
            month,
            invested: monthInvested,
            sharesAccumulated: { ...sharesAccumulated },
            valueAtMonth,
            cumulativeReturn: totalInvested > 0 ? ((valueAtMonth - totalInvested) / totalInvested) * 100 : 0
        })
    }

    // Final current value (using absolute latest prices)
    const currentValue = calculateCurrentValue(sharesAccumulated, priceData)
    const returnPct = totalInvested > 0 ? ((currentValue - totalInvested) / totalInvested) * 100 : 0

    return {
        totalInvested,
        currentValue,
        returnPct,
        monthlyDetails
    }
}

/**
 * Calculate performance for Equal DCA strategy
 */
export function calculateEqualDCAPerformance(
    recommendations: Recommendation[],
    priceData: StockPriceMap,
    buyDayOfMonth: number = 2
): BacktestResult {
    const monthlyDetails: MonthlyPerformance[] = []
    const sharesAccumulated: { [symbol: string]: number } = {}
    let totalInvested = 0

    // Group recommendations by month
    const monthlyRecs = groupByMonth(recommendations)

    for (const [month, recs] of Object.entries(monthlyRecs)) {
        const buyDate = getBuyDate(month, buyDayOfMonth)

        // Get unique symbols for this month
        const symbols = [...new Set(recs.map(r => r.symbol))]
        const totalBudget = recs.reduce((sum, r) => sum + r.amount_usd, 0)
        const equalAllocation = totalBudget / symbols.length

        let monthInvested = 0

        // Buy equal amounts for each symbol
        for (const symbol of symbols) {
            const price = getPriceAtDate(priceData[symbol], buyDate)
            if (price) {
                const shares = equalAllocation / price
                sharesAccumulated[symbol] = (sharesAccumulated[symbol] || 0) + shares
                monthInvested += equalAllocation
            }
        }

        totalInvested += monthInvested

        // Calculate value at this month
        const valueAtMonth = calculateCurrentValue(sharesAccumulated, priceData, buyDate)

        monthlyDetails.push({
            month,
            invested: monthInvested,
            sharesAccumulated: { ...sharesAccumulated },
            valueAtMonth,
            cumulativeReturn: totalInvested > 0 ? ((valueAtMonth - totalInvested) / totalInvested) * 100 : 0
        })
    }

    // Final current value
    const currentValue = calculateCurrentValue(sharesAccumulated, priceData)
    const returnPct = totalInvested > 0 ? ((currentValue - totalInvested) / totalInvested) * 100 : 0

    return {
        totalInvested,
        currentValue,
        returnPct,
        monthlyDetails
    }
}

/**
 * Compare Smart DCA vs Equal DCA
 */
export function compareStrategies(
    recommendations: Recommendation[],
    priceData: StockPriceMap,
    buyDayOfMonth: number = 2
): ComparisonResult {
    const smartDCA = calculateSmartDCAPerformance(recommendations, priceData, buyDayOfMonth)
    const equalDCA = calculateEqualDCAPerformance(recommendations, priceData, buyDayOfMonth)

    return {
        smartDCA,
        equalDCA,
        difference: {
            valueDiff: smartDCA.currentValue - equalDCA.currentValue,
            returnDiff: smartDCA.returnPct - equalDCA.returnPct
        }
    }
}

// Helper functions

function groupByMonth(recommendations: Recommendation[]): { [month: string]: Recommendation[] } {
    const grouped: { [month: string]: Recommendation[] } = {}
    for (const rec of recommendations) {
        if (!grouped[rec.month]) {
            grouped[rec.month] = []
        }
        grouped[rec.month].push(rec)
    }
    return grouped
}

function getBuyDate(month: string, day: number): Date {
    // month format: YYYY-MM
    const [year, monthNum] = month.split('-').map(Number)
    return new Date(year, monthNum - 1, day)
}

function getPriceAtDate(prices: StockPrice[] | undefined, targetDate: Date): number | null {
    if (!prices || prices.length === 0) return null

    const targetDateStr = targetDate.toISOString().split('T')[0]

    // Try to find exact match
    const exactMatch = prices.find(p => p.date === targetDateStr)
    if (exactMatch) {
        return parseFloat(exactMatch.close_price.toString())
    }

    // Find closest date before or on target date
    const sortedPrices = [...prices].sort((a, b) => a.date.localeCompare(b.date))
    let closestPrice: StockPrice | null = null

    for (const price of sortedPrices) {
        if (price.date <= targetDateStr) {
            closestPrice = price
        } else {
            break
        }
    }

    return closestPrice ? parseFloat(closestPrice.close_price.toString()) : null
}

function calculateCurrentValue(
    shares: { [symbol: string]: number },
    priceData: StockPriceMap,
    asOfDate?: Date
): number {
    let totalValue = 0

    for (const [symbol, shareCount] of Object.entries(shares)) {
        const prices = priceData[symbol]
        if (!prices || prices.length === 0) continue

        let currentPrice: number | null = null

        if (asOfDate) {
            currentPrice = getPriceAtDate(prices, asOfDate)
        } else {
            // Get latest price
            const sortedPrices = [...prices].sort((a, b) => b.date.localeCompare(a.date))
            currentPrice = parseFloat(sortedPrices[0].close_price.toString())
        }

        if (currentPrice) {
            totalValue += shareCount * currentPrice
        }
    }

    return totalValue
}
