// Stock Price API Integration
// Supports Alpha Vantage and Finnhub (configurable)

export interface StockPriceData {
    symbol: string
    date: string
    close: number
}

/**
 * Fetch stock price from Alpha Vantage
 */
async function fetchFromAlphaVantage(
    symbol: string,
    apiKey: string
): Promise<StockPriceData[]> {
    const url = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${symbol}&apikey=${apiKey}`

    const response = await fetch(url)
    if (!response.ok) {
        throw new Error(`Alpha Vantage API error: ${response.statusText}`)
    }

    const data = await response.json()

    if (data['Error Message']) {
        throw new Error(`Invalid symbol: ${symbol}`)
    }

    if (data['Note']) {
        throw new Error('API rate limit exceeded')
    }

    const timeSeries = data['Time Series (Daily)']
    if (!timeSeries) {
        throw new Error('No data available')
    }

    // Convert to our format
    const prices: StockPriceData[] = []
    for (const [date, values] of Object.entries(timeSeries)) {
        prices.push({
            symbol,
            date,
            close: parseFloat((values as any)['4. close']),
        })
    }

    return prices
}

/**
 * Fetch stock price from Finnhub
 */
async function fetchFromFinnhub(
    symbol: string,
    apiKey: string
): Promise<StockPriceData[]> {
    // Get last 6 months of data
    const to = Math.floor(Date.now() / 1000)
    const from = to - (180 * 24 * 60 * 60) // 6 months ago

    const url = `https://finnhub.io/api/v1/stock/candle?symbol=${symbol}&resolution=D&from=${from}&to=${to}&token=${apiKey}`

    const response = await fetch(url)
    if (!response.ok) {
        throw new Error(`Finnhub API error: ${response.statusText}`)
    }

    const data = await response.json()

    if (data.s !== 'ok') {
        throw new Error(`No data available for symbol: ${symbol}`)
    }

    // Convert to our format
    const prices: StockPriceData[] = []
    for (let i = 0; i < data.t.length; i++) {
        const date = new Date(data.t[i] * 1000).toISOString().split('T')[0]
        prices.push({
            symbol,
            date,
            close: data.c[i],
        })
    }

    return prices
}

/**
 * Main function to fetch stock prices
 * Uses environment variable to determine which API to use
 */
export async function fetchStockPrices(
    symbol: string
): Promise<StockPriceData[]> {
    const apiKey = process.env.STOCK_API_KEY
    if (!apiKey) {
        throw new Error('STOCK_API_KEY environment variable not set')
    }

    // Try Alpha Vantage first (default)
    try {
        return await fetchFromAlphaVantage(symbol, apiKey)
    } catch (error) {
        console.warn(`Alpha Vantage failed for ${symbol}, trying Finnhub...`, error)

        // Fallback to Finnhub
        try {
            return await fetchFromFinnhub(symbol, apiKey)
        } catch (finnhubError) {
            throw new Error(`Failed to fetch prices for ${symbol}: ${(finnhubError as Error).message}`)
        }
    }
}

/**
 * Get current price (most recent close)
 */
export function getCurrentPrice(prices: StockPriceData[]): number {
    if (prices.length === 0) {
        throw new Error('No price data available')
    }

    // Sort by date descending and get first
    const sorted = prices.sort((a, b) =>
        new Date(b.date).getTime() - new Date(a.date).getTime()
    )

    return sorted[0].close
}

/**
 * Get historical prices for a specific date range
 */
export function getHistoricalPrices(
    prices: StockPriceData[],
    months: number
): StockPriceData[] {
    const cutoffDate = new Date()
    cutoffDate.setMonth(cutoffDate.getMonth() - months)

    return prices
        .filter(p => new Date(p.date) >= cutoffDate)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}
