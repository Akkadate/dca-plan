import YahooFinance from 'yahoo-finance2'

export interface StockMetrics {
    pe_ratio: number | null
    dividend_yield: number | null
    market_cap: string
    week52_high: number
    week52_low: number
    beta: number | null
}

export interface StockData {
    symbol: string
    name: string
    current_price: number
    metrics: StockMetrics
    isEstimate?: boolean
    error?: string
}

// Create Yahoo Finance instance (required for v2+)
const yahooFinance = new YahooFinance()

/**
 * Fetch stock data from Alpha Vantage (US stocks)
 */
export async function fetchAlphaVantageData(symbol: string): Promise<StockData> {
    const apiKey = process.env.STOCK_API_KEY

    if (!apiKey) {
        throw new Error('STOCK_API_KEY not configured')
    }

    try {
        // Fetch quote (price)
        const quoteUrl = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${apiKey}`
        const quoteResponse = await fetch(quoteUrl)
        const quoteData = await quoteResponse.json()

        if (quoteData.Note?.includes('rate limit')) {
            throw new Error('Alpha Vantage rate limit exceeded')
        }

        const quote = quoteData['Global Quote']
        if (!quote || !quote['05. price']) {
            throw new Error(`Symbol ${symbol} not found`)
        }

        // Fetch overview (fundamentals)
        const overviewUrl = `https://www.alphavantage.co/query?function=OVERVIEW&symbol=${symbol}&apikey=${apiKey}`
        const overviewResponse = await fetch(overviewUrl)
        const overview = await overviewResponse.json()

        const price = parseFloat(quote['05. price'])
        const week52High = parseFloat(quote['03. high']) || price
        const week52Low = parseFloat(quote['04. low']) || price

        return {
            symbol,
            name: overview.Name || symbol,
            current_price: price,
            metrics: {
                pe_ratio: overview.PERatio ? parseFloat(overview.PERatio) : null,
                dividend_yield: overview.DividendYield
                    ? parseFloat(overview.DividendYield) * 100
                    : null,
                market_cap: formatMarketCap(overview.MarketCapitalization),
                week52_high: overview['52WeekHigh']
                    ? parseFloat(overview['52WeekHigh'])
                    : week52High,
                week52_low: overview['52WeekLow']
                    ? parseFloat(overview['52WeekLow'])
                    : week52Low,
                beta: overview.Beta ? parseFloat(overview.Beta) : null
            }
        }
    } catch (error: any) {
        console.error(`Error fetching Alpha Vantage data for ${symbol}:`, error)
        throw error
    }
}

/**
 * Fetch historical stock prices from Yahoo Finance
 * Used to populate price history for DCA MA50 calculation
 * @param symbol - Stock symbol (already formatted: AAPL or PTT.BK)
 * @param days - Number of days to fetch (default: 50 for MA50)
 * @returns Array of historical prices
 */
export async function fetchHistoricalPrices(
    symbol: string,
    days: number = 50
): Promise<Array<{ date: string; close: number }>> {
    try {
        console.log(`[Historical] Fetching ${days} days of data for ${symbol}...`)

        const endDate = new Date()
        const startDate = new Date()
        // Add buffer for weekends/holidays
        startDate.setDate(startDate.getDate() - Math.ceil(days * 1.5))

        // Use Yahoo Finance v2 historical API
        const historicalData = await yahooFinance.historical(symbol, {
            period1: startDate,
            period2: endDate,
            interval: '1d'  // Daily data
        }) as any[]

        if (!historicalData || historicalData.length === 0) {
            throw new Error(`No historical data found for ${symbol}`)
        }

        // Take last N days (sorted by date)
        const prices = historicalData
            .filter(item => item && item.date && item.close)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, days)
            .map(item => ({
                date: item.date.toISOString().split('T')[0],
                close: item.close
            }))

        console.log(`[Historical] ✅ Fetched ${prices.length}/${days} days for ${symbol}`)

        if (prices.length < days) {
            console.warn(`[Historical] ⚠️ Only got ${prices.length}/${days} days for ${symbol}`)
        }

        return prices
    } catch (error: any) {
        console.error(`[Historical] ❌ Error fetching historical data for ${symbol}:`, error.message)
        throw error
    }
}

/**
 * Fetch stock data from Yahoo Finance
 * Note: Symbol should already be formatted correctly (e.g., PTT.BK for Thai, AAPL for US)
 */
export async function fetchYahooFinanceData(symbol: string): Promise<StockData> {
    try {
        // Symbol should already be properly formatted by caller
        // Do NOT add .BK here - it causes US stocks to be treated as Thai stocks!
        const quote = await yahooFinance.quote(symbol) as any

        if (!quote || !quote.regularMarketPrice) {
            throw new Error(`Symbol ${symbol} not found on Yahoo Finance`)
        }

        return {
            symbol,
            name: quote.longName || quote.shortName || symbol,
            current_price: quote.regularMarketPrice,
            metrics: {
                pe_ratio: quote.trailingPE || null,
                dividend_yield: quote.dividendYield || null,  // Already in percentage (e.g., 5.33)
                market_cap: formatMarketCap(quote.marketCap),
                week52_high: quote.fiftyTwoWeekHigh || quote.regularMarketPrice,
                week52_low: quote.fiftyTwoWeekLow || quote.regularMarketPrice,
                beta: quote.beta || null
            }
        }
    } catch (error: any) {
        console.error(`Error fetching Yahoo Finance data for ${symbol}:`, error)
        throw error
    }
}

/**
 * Main function to fetch stock data based on market
 */
export async function fetchStockData(
    symbol: string,
    market: 'US' | 'TH'
): Promise<StockData> {
    try {
        console.log(`Fetching ${market} data for ${symbol}...`)

        // Use Yahoo Finance for BOTH US and Thai stocks
        // Yahoo Finance has no rate limits and provides complete data
        const yahooSymbol = market === 'TH'
            ? (symbol.includes('.') ? symbol : `${symbol}.BK`)  // Thai: add .BK suffix
            : symbol  // US: use symbol as-is (AAPL, MSFT, etc.)

        const data = await fetchYahooFinanceData(yahooSymbol)
        console.log(`✅ Successfully fetched ${symbol} from Yahoo Finance: price=$${data.current_price}, market_cap=${data.metrics.market_cap}`)
        return data
    } catch (error: any) {
        console.error(`❌ Error fetching ${market} data for ${symbol}:`, error.message)
        // Return placeholder data with error flag
        return {
            symbol,
            name: symbol,
            current_price: 0,
            metrics: {
                pe_ratio: null,
                dividend_yield: null,
                market_cap: 'N/A',
                week52_high: 0,
                week52_low: 0,
                beta: null
            },
            isEstimate: true,
            error: error.message || 'Failed to fetch real-time data'
        }
    }
}

/**
 * Batch fetch stock data with rate limiting
 */
export async function batchFetchStockData(
    symbols: string[],
    market: 'US' | 'TH'
): Promise<StockData[]> {
    const results: StockData[] = []
    const DELAY_BETWEEN_REQUESTS = market === 'US' ? 12000 : 1000 // 12s for Alpha Vantage, 1s for Yahoo

    for (let i = 0; i < symbols.length; i++) {
        const data = await fetchStockData(symbols[i], market)
        results.push(data)

        // Add delay between requests (except for last one)
        if (i < symbols.length - 1) {
            await sleep(DELAY_BETWEEN_REQUESTS)
        }
    }

    return results
}

/**
 * Format market cap to readable string
 */
function formatMarketCap(marketCap: number | string | undefined): string {
    if (!marketCap) return 'N/A'

    const num = typeof marketCap === 'string' ? parseInt(marketCap) : marketCap

    if (num >= 1_000_000_000_000) {
        return `${(num / 1_000_000_000_000).toFixed(2)}T`
    } else if (num >= 1_000_000_000) {
        return `${(num / 1_000_000_000).toFixed(2)}B`
    } else if (num >= 1_000_000) {
        return `${(num / 1_000_000).toFixed(2)}M`
    }

    return num.toString()
}

/**
 * Sleep utility
 */
function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
}
