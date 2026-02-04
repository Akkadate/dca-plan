/**
 * LINE Message Templates
 * Bilingual support: Thai (th) and English (en)
 */

export type Language = 'th' | 'en'

interface LineMessageTemplates {
    header: (month: string) => string
    portfolioLabel: string
    budgetLabel: string
    planTitle: string
    amountLabel: string
    reasonLabel: string
    aiAnalysisLabel: string
    riskLabel: string
    totalLabel: string
    nextCalculationLabel: string
    aiDisclaimer: string
    buyDate: string
}

const templates: Record<Language, LineMessageTemplates> = {
    th: {
        header: (month) => `🤖 แผน DCA - ${month}`,
        portfolioLabel: 'พอร์ต',
        budgetLabel: 'งบประจำเดือน',
        planTitle: '📊 แผนการลงทุนเดือนนี้:',
        amountLabel: 'จำนวน',
        reasonLabel: 'เหตุผล',
        aiAnalysisLabel: '💡 AI วิเคราะห์',
        riskLabel: 'ความเสี่ยง',
        totalLabel: 'รวม',
        nextCalculationLabel: 'คำนวณครั้งถัดไป',
        aiDisclaimer: '💡 AI วิเคราะห์เพื่อให้ข้อมูลเท่านั้น\nน้ำหนัก DCA คำนวณด้วย MA50 algorithm',
        buyDate: '✅ ซื้อได้ตั้งแต่วันที่ 2 ของเดือน'
    },
    en: {
        header: (month) => `🤖 DCA Plan - ${month}`,
        portfolioLabel: 'Portfolio',
        budgetLabel: 'Monthly Budget',
        planTitle: '📊 This Month\'s Investment Plan:',
        amountLabel: 'Amount',
        reasonLabel: 'Reason',
        aiAnalysisLabel: '💡 AI Analysis',
        riskLabel: 'Risk',
        totalLabel: 'Total',
        nextCalculationLabel: 'Next calculation',
        aiDisclaimer: '💡 AI insights are for context only.\nDCA weights calculated by MA50 algorithm.',
        buyDate: '✅ You can buy from the 2nd of this month'
    }
}

// Reason translations
const reasonTranslations: Record<string, Record<Language, string>> = {
    'ข้อมูลไม่เพียงพอ ใช้ Equal DCA': {
        th: 'ข้อมูลไม่เพียงพอ ใช้ Equal DCA',
        en: 'Insufficient data, using Equal DCA'
    },
    'ราคาต่ำกว่าค่าเฉลี่ย': {
        th: 'ราคาต่ำกว่าค่าเฉลี่ย MA50',
        en: 'Price below MA50 average'
    },
    'ราคาสูงกว่าค่าเฉลี่ยเล็กน้อย': {
        th: 'ราคาสูงกว่าค่าเฉลี่ยเล็กน้อย',
        en: 'Price slightly above average'
    },
    'สัดส่วนพอร์ตต่ำกว่าเป้าหมาย': {
        th: 'สัดส่วนพอร์ตต่ำกว่าเป้าหมาย',
        en: 'Portfolio weight below target'
    },
    'สัดส่วนพอร์ตสูงกว่าเป้าหมาย': {
        th: 'สัดส่วนพอร์ตสูงกว่าเป้าหมาย',
        en: 'Portfolio weight above target'
    },
    'ความผันผวนสูง': {
        th: 'ความผันผวนสูง',
        en: 'High volatility'
    },
    'target weight ปกติ': {
        th: 'ใกล้ target weight และราคาปกติ',
        en: 'Near target weight, normal price'
    }
}

export function getTemplates(lang: Language): LineMessageTemplates {
    return templates[lang] || templates.th
}

export function translateReason(reason: string, lang: Language): string {
    // Try exact match first
    if (reasonTranslations[reason]) {
        return reasonTranslations[reason][lang]
    }

    // Try partial match
    for (const [key, translations] of Object.entries(reasonTranslations)) {
        if (reason.includes(key) || key.includes(reason)) {
            return translations[lang]
        }
    }

    // Return original if no translation found
    return reason
}

export function formatMonth(date: Date, lang: Language): string {
    const locale = lang === 'th' ? 'th-TH' : 'en-US'
    return date.toLocaleDateString(locale, { month: 'long', year: 'numeric' })
}

export function formatDate(date: Date, lang: Language): string {
    const locale = lang === 'th' ? 'th-TH' : 'en-US'
    return date.toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' })
}

export function getRiskLabel(level: string, lang: Language): string {
    const labels: Record<string, Record<Language, string>> = {
        low: { th: 'ต่ำ', en: 'LOW' },
        medium: { th: 'ปานกลาง', en: 'MEDIUM' },
        high: { th: 'สูง', en: 'HIGH' }
    }
    return labels[level]?.[lang] || level.toUpperCase()
}
