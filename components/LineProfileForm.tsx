'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface LineProfileFormProps {
    userId: string
    existingLineUserId?: string
}

export default function LineProfileForm({ userId, existingLineUserId }: LineProfileFormProps) {
    const [lineUserId, setLineUserId] = useState(existingLineUserId || '')
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const router = useRouter()
    const supabase = createClient()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        setSuccess(false)
        setLoading(true)

        try {
            if (!lineUserId.trim()) {
                throw new Error('Please enter your LINE User ID')
            }

            const { error } = await supabase
                .from('line_profiles')
                .upsert({
                    user_id: userId,
                    line_user_id: lineUserId.trim(),
                }, {
                    onConflict: 'user_id'
                })

            if (error) throw error

            setSuccess(true)
            router.refresh()
        } catch (error: any) {
            setError(error.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                LINE Notifications
            </h2>

            <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                <p>รับการแจ้งเตือนแผน DCA ทาง LINE ทุกวันที่ 1 ของเดือน</p>
                <p className="mt-2">
                    <a
                        href="https://developers.line.biz/en/docs/messaging-api/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-700 dark:text-blue-400 underline"
                    >
                        วิธีหา LINE User ID →
                    </a>
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                    <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 p-3 rounded-lg text-sm">
                        ✓ LINE profile saved successfully!
                    </div>
                )}

                <div>
                    <label htmlFor="lineUserId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        LINE User ID
                    </label>
                    <input
                        id="lineUserId"
                        type="text"
                        value={lineUserId}
                        onChange={(e) => setLineUserId(e.target.value)}
                        required
                        placeholder="Uxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-semibold rounded-lg transition"
                >
                    {loading ? 'Saving...' : existingLineUserId ? 'Update LINE Profile' : 'Connect LINE'}
                </button>
            </form>
        </div>
    )
}
