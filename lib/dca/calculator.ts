import { PortfolioStock, StockPrice } from '@/lib/types/database'

export interface DCAInput {
    stock: PortfolioStock
    currentPrice: number
    priceHistory: StockPrice[] // At least 6 months of data
    actualWeight?: number // Current portfolio weight (optional)
    monthlyBudget: number
}

export interface DCAOutput {
    symbol: string
    finalWeight: number
    amountUSD: number
    reason: string
}

export interface WeightAdjustment {
    priceDeviation: number
    portfolioDrift: number
    volatilityGuard: number
}

/**
 * Calculate 6-month moving average (MA6)
 */
export function calculateMA6(priceHistory: StockPrice[]): number {
    if (priceHistory.length < 6) {
        throw new Error('Insufficient price history for MA6 calculation')
    }

    // Sort by date descending and take last 6 months
    const sortedPrices = priceHistory
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 6)

    const sum = sortedPrices.reduce((acc, price) => acc + parseFloat(price.close_price.toString()), 0)
    return sum / 6
}

/**
 * Calculate 3-month volatility (standard deviation)
 */
export function calculate3MonthVolatility(priceHistory: StockPrice[]): number {
    if (priceHistory.length < 3) {
        return 0
    }

    const sortedPrices = priceHistory
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 3)
        .map(p => parseFloat(p.close_price.toString()))

    const mean = sortedPrices.reduce((acc, p) => acc + p, 0) / sortedPrices.length
    const variance = sortedPrices.reduce((acc, p) => acc + Math.pow(p - mean, 2), 0) / sortedPrices.length
    return Math.sqrt(variance) / mean // Coefficient of variation
}

/**
 * STEP 2: Price Deviation Adjustment
 * Compare current price to MA6
 */
export function getPriceDeviationAdjustment(currentPrice: number, ma6: number): number {
    const ratio = currentPrice / ma6

    if (ratio < 0.90) {
        return 0.10 // +10% when price is low
    } else if (ratio > 1.05) {
        return -0.10 // -10% when price is high
    }
    return 0 // No adjustment
}

/**
 * STEP 3: Portfolio Drift Adjustment
 * Compare actual weight to target weight
 */
export function getPortfolioDriftAdjustment(
    actualWeight: number | undefined,
    targetWeight: number
): number {
    if (actualWeight === undefined) {
        return 0 // No actual weight data, no adjustment
    }

    const drift = actualWeight - targetWeight

    if (drift < -5) {
        return 0.10 // +10% when underweight
    } else if (drift > 5) {
        return -0.10 // -10% when overweight
    }
    return 0 // No adjustment
}

/**
 * STEP 4: Volatility Guard (Optional)
 * Reduce weight if volatility is high
 */
export function getVolatilityGuardAdjustment(
    volatility: number,
    threshold: number = 0.15
): number {
    if (volatility > threshold) {
        return -0.05 // -5% for high volatility
    }
    return 0
}

/**
 * STEP 5: Clamp weight to min/max bounds
 */
export function clampWeight(
    weight: number,
    minWeight: number,
    maxWeight: number
): number {
    return Math.max(minWeight, Math.min(maxWeight, weight))
}

/**
 * Full DCA Weight Calculation (Steps 1-5)
 */
export function calculateDCAWeight(input: DCAInput): {
    finalWeight: number
    adjustments: WeightAdjustment
} {
    // STEP 1: Base weight
    const baseWeight = parseFloat(input.stock.target_weight.toString())

    // STEP 2: Price deviation adjustment
    const ma6 = calculateMA6(input.priceHistory)
    const priceDeviation = getPriceDeviationAdjustment(input.currentPrice, ma6)

    // STEP 3: Portfolio drift adjustment
    const portfolioDrift = getPortfolioDriftAdjustment(
        input.actualWeight,
        baseWeight
    )

    // STEP 4: Volatility guard
    const volatility = calculate3MonthVolatility(input.priceHistory)
    const volatilityGuard = getVolatilityGuardAdjustment(volatility)

    // Calculate total adjustment
    const totalAdjustment = priceDeviation + portfolioDrift + volatilityGuard

    // Apply adjustment to base weight (adjustment is percentage, so multiply)
    const adjustedWeight = baseWeight * (1 + totalAdjustment)

    // STEP 5: Clamp to min/max
    const finalWeight = clampWeight(
        adjustedWeight,
        parseFloat(input.stock.min_weight.toString()),
        parseFloat(input.stock.max_weight.toString())
    )

    return {
        finalWeight,
        adjustments: {
            priceDeviation,
            portfolioDrift,
            volatilityGuard,
        },
    }
}

/**
 * STEP 6: Normalize weights to sum to 100%
 */
export function normalizeWeights(weights: number[]): number[] {
    const total = weights.reduce((sum, w) => sum + w, 0)
    if (total === 0) return weights
    return weights.map(w => (w / total) * 100)
}

/**
 * STEP 7: Convert normalized weight to USD amount
 * Ensure minimum $1 per stock
 */
export function convertToUSD(
    normalizedWeight: number,
    monthlyBudget: number,
    minimumUSD: number = 1
): number {
    const amount = (normalizedWeight / 100) * monthlyBudget
    return Math.max(minimumUSD, amount)
}

/**
 * Calculate DCA for all stocks in a portfolio
 */
export function calculatePortfolioDCA(
    inputs: DCAInput[]
): DCAOutput[] {
    if (inputs.length === 0) {
        return []
    }

    // Calculate individual weights
    const results = inputs.map(input => {
        try {
            const { finalWeight, adjustments } = calculateDCAWeight(input)
            return {
                symbol: input.stock.symbol,
                rawWeight: finalWeight,
                adjustments,
                input,
            }
        } catch (error) {
            console.error(`Error calculating weight for ${input.stock.symbol}:`, error)
            // Fallback to target weight
            return {
                symbol: input.stock.symbol,
                rawWeight: parseFloat(input.stock.target_weight.toString()),
                adjustments: { priceDeviation: 0, portfolioDrift: 0, volatilityGuard: 0 },
                input,
            }
        }
    })

    // STEP 6: Normalize weights
    const normalizedWeights = normalizeWeights(results.map(r => r.rawWeight))

    // STEP 7: Convert to USD and generate output
    const monthlyBudget = inputs[0]?.monthlyBudget || 0

    return results.map((result, index) => ({
        symbol: result.symbol,
        finalWeight: normalizedWeights[index],
        amountUSD: convertToUSD(normalizedWeights[index], monthlyBudget),
        reason: generateReason(result.adjustments, result.input),
    }))
}

/**
 * Generate reason text based on adjustments
 */
function generateReason(
    adjustments: WeightAdjustment,
    input: DCAInput
): string {
    const reasons: string[] = []

    if (adjustments.priceDeviation > 0) {
        reasons.push('ราคาต่ำกว่าค่าเฉลี่ย 6 เดือน')
    } else if (adjustments.priceDeviation < 0) {
        reasons.push('ราคาสูงกว่าค่าเฉลี่ยเล็กน้อย')
    }

    if (adjustments.portfolioDrift > 0) {
        reasons.push('สัดส่วนพอร์ตต่ำกว่าเป้าหมาย')
    } else if (adjustments.portfolioDrift < 0) {
        reasons.push('สัดส่วนพอร์ตสูงกว่าเป้าหมาย')
    }

    if (adjustments.volatilityGuard < 0) {
        reasons.push('ความผันผวนสูง')
    }

    if (reasons.length === 0) {
        return 'ใกล้ target weight และราคาปกติ'
    }

    if (adjustments.priceDeviation > 0 || adjustments.portfolioDrift > 0) {
        return reasons.join(' และ ') + ' จึงเพิ่มน้ำหนัก DCA เล็กน้อย'
    } else {
        return reasons.join(' และ ') + ' จึงลดน้ำหนัก DCA เล็กน้อย'
    }
}

/**
 * Fallback: Equal DCA when data is insufficient
 */
export function calculateEqualDCA(
    stocks: PortfolioStock[],
    monthlyBudget: number
): DCAOutput[] {
    if (stocks.length === 0) return []

    const equalWeight = 100 / stocks.length
    const equalAmount = monthlyBudget / stocks.length

    return stocks.map(stock => ({
        symbol: stock.symbol,
        finalWeight: equalWeight,
        amountUSD: Math.max(1, equalAmount),
        reason: 'ข้อมูลไม่เพียงพอ ใช้ Equal DCA',
    }))
}
