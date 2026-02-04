'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface LanguageSettingProps {
    userId: string
    currentLanguage: 'th' | 'en'
}

export default function LanguageSetting({ userId, currentLanguage }: LanguageSettingProps) {
    const [language, setLanguage] = useState<'th' | 'en'>(currentLanguage)
    const [saving, setSaving] = useState(false)
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

    const handleChange = async (newLang: 'th' | 'en') => {
        if (newLang === language) return

        setSaving(true)
        setMessage(null)

        try {
            const supabase = createClient()

            const { error } = await supabase
                .from('users')
                .update({ language_preference: newLang })
                .eq('id', userId)

            if (error) throw error

            setLanguage(newLang)
            setMessage({
                type: 'success',
                text: newLang === 'th'
                    ? '✅ บันทึกภาษาเรียบร้อย'
                    : '✅ Language preference saved'
            })
        } catch (error: any) {
            console.error('Error saving language:', error)
            setMessage({
                type: 'error',
                text: language === 'th'
                    ? '❌ เกิดข้อผิดพลาด'
                    : '❌ Failed to save'
            })
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                🌐 {language === 'th' ? 'ภาษา / Language' : 'Language / ภาษา'}
            </h2>

            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                {language === 'th'
                    ? 'เลือกภาษาสำหรับข้อความ LINE notification'
                    : 'Choose language for LINE notification messages'}
            </p>

            <div className="flex gap-4">
                <button
                    onClick={() => handleChange('th')}
                    disabled={saving}
                    className={`flex-1 py-3 px-4 rounded-lg border-2 transition font-medium ${language === 'th'
                            ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                            : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 text-gray-700 dark:text-gray-300'
                        }`}
                >
                    🇹🇭 ไทย (Thai)
                    {language === 'th' && <span className="ml-2">✓</span>}
                </button>

                <button
                    onClick={() => handleChange('en')}
                    disabled={saving}
                    className={`flex-1 py-3 px-4 rounded-lg border-2 transition font-medium ${language === 'en'
                            ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                            : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 text-gray-700 dark:text-gray-300'
                        }`}
                >
                    🇺🇸 English
                    {language === 'en' && <span className="ml-2">✓</span>}
                </button>
            </div>

            {saving && (
                <p className="text-sm text-gray-500 mt-3">
                    {language === 'th' ? '⏳ กำลังบันทึก...' : '⏳ Saving...'}
                </p>
            )}

            {message && (
                <p className={`text-sm mt-3 ${message.type === 'success' ? 'text-green-600' : 'text-red-600'
                    }`}>
                    {message.text}
                </p>
            )}

            <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
                {language === 'th'
                    ? '* ภาษานี้จะใช้กับ LINE notification เท่านั้น'
                    : '* This language applies to LINE notifications only'}
            </p>
        </div>
    )
}
