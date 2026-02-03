import yahooFinance from 'yahoo-finance2'

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
 * Fetch stock data from Yahoo Finance (Thai stocks)
 */
export async function fetchYahooFinanceData(symbol: string): Promise<StockData> {
    try {
        // Add .BK suffix for Thai stocks if not present
        const yahooSymbol = symbol.includes('.') ? symbol : `${symbol}.BK`

        const quote = await yahooFinance.quote(yahooSymbol)

        if (!quote || !quote.regularMarketPrice) {
            throw new Error(`Symbol ${symbol} not found on Yahoo Finance`)
        }

        return {
            symbol,
            name: quote.longName || quote.shortName || symbol,
            current_price: quote.regularMarketPrice,
            metrics: {
                pe_ratio: quote.trailingPE || null,
                dividend_yield: quote.dividendYield
                    ? quote.dividendYield * 100
                    : null,
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
        if (market === 'US') {
            return await fetchAlphaVantageData(symbol)
        } else {
            return await fetchYahooFinanceData(symbol)
        }
    } catch (error: any) {
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
