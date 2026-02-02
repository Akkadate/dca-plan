'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function TestPage() {
    const [loading, setLoading] = useState('')
    const [result, setResult] = useState<any>(null)
    const [error, setError] = useState<string | null>(null)

    const testEndpoint = async (endpoint: string, name: string) => {
        setLoading(name)
        setResult(null)
        setError(null)

        try {
            const cronSecret = prompt('Enter CRON_SECRET:')
            if (!cronSecret) {
                setError('CRON_SECRET is required')
                setLoading('')
                return
            }

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${cronSecret}`,
                },
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Request failed')
            }

            setResult(data)
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading('')
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Header */}
            <header className="bg-white dark:bg-gray-800 shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div>
                        <Link
                            href="/settings"
                            className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 mb-2 inline-block"
                        >
                            ← Back to Settings
                        </Link>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                            🧪 Test Cron Jobs
                        </h1>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="space-y-6">
                    {/* Instructions */}
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
                        <h2 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
                            📋 วิธีทดสอบ
                        </h2>
                        <ol className="list-decimal list-inside space-y-2 text-sm text-blue-700 dark:text-blue-300">
                            <li>ต้องมี portfolio และ stocks ในระบบก่อน</li>
                            <li>กด "Test Calculate DCA" เพื่อคำนวณแผน DCA</li>
                            <li>ตรวจสอบว่ามี recommendations ในฐานข้อมูล</li>
                            <li>เชื่อม LINE profile ใน Settings</li>
                            <li>กด "Test LINE Notification" เพื่อส่งข้อความ</li>
                        </ol>
                    </div>

                    {/* Test Buttons */}
                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Calculate DCA */}
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                                1️⃣ Calculate DCA
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                                คำนวณแผน DCA สำหรับเดือนปัจจุบัน
                            </p>
                            <button
                                onClick={() => testEndpoint('/api/cron/calculate-dca', 'calculate')}
                                disabled={loading === 'calculate'}
                                className="w-full px-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-semibold rounded-lg transition"
                            >
                                {loading === 'calculate' ? 'Testing...' : 'Test Calculate DCA'}
                            </button>
                        </div>

                        {/* LINE Notification */}
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                                2️⃣ LINE Notification
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                                ส่งข้อความแผน DCA ไปยัง LINE
                            </p>
                            <button
                                onClick={() => testEndpoint('/api/cron/send-line-notifications', 'line')}
                                disabled={loading === 'line'}
                                className="w-full px-4 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white font-semibold rounded-lg transition"
                            >
                                {loading === 'line' ? 'Sending...' : 'Test LINE Notification'}
                            </button>
                        </div>
                    </div>

                    {/* Error Display */}
                    {error && (
                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
                            <h3 className="text-lg font-semibold text-red-900 dark:text-red-100 mb-2">
                                ❌ Error
                            </h3>
                            <p className="text-sm text-red-700 dark:text-red-300 font-mono">
                                {error}
                            </p>
                        </div>
                    )}

                    {/* Result Display */}
                    {result && (
                        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6">
                            <h3 className="text-lg font-semibold text-green-900 dark:text-green-100 mb-2">
                                ✅ Success
                            </h3>
                            <pre className="text-sm text-green-700 dark:text-green-300 font-mono overflow-x-auto">
                                {JSON.stringify(result, null, 2)}
                            </pre>
                        </div>
                    )}

                    {/* CRON_SECRET Note */}
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
                        <h3 className="text-lg font-semibold text-yellow-900 dark:text-yellow-100 mb-2">
                            🔑 CRON_SECRET
                        </h3>
                        <p className="text-sm text-yellow-700 dark:text-yellow-300">
                            คุณจะถูกขอให้ใส่ CRON_SECRET ที่ตั้งไว้ใน environment variables
                        </p>
                        <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-2">
                            ดูได้จาก: <code className="bg-yellow-100 dark:bg-yellow-900 px-2 py-1 rounded">.env.local</code>
                        </p>
                    </div>
                </div>
            </main>
        </div>
    )
}
