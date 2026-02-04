import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import LineProfileForm from '@/components/LineProfileForm'
import LanguageSetting from '@/components/LanguageSetting'

export default async function SettingsPage() {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Fetch existing LINE profile
    const { data: lineProfile } = await supabase
        .from('line_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()

    // Fetch user data for language preference
    const { data: userData } = await supabase
        .from('users')
        .select('language_preference')
        .eq('id', user.id)
        .single()

    const currentLanguage = (userData?.language_preference || 'th') as 'th' | 'en'

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Header */}
            <header className="bg-white dark:bg-gray-800 shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <Link
                                href="/dashboard"
                                className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 mb-2 inline-block"
                            >
                                ← Back to Dashboard
                            </Link>
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                                Settings
                            </h1>
                        </div>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                            {user.email}
                        </span>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="space-y-6">
                    {/* Account Info */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                            Account Information
                        </h2>
                        <div className="space-y-2">
                            <div>
                                <span className="text-sm text-gray-600 dark:text-gray-400">Email:</span>
                                <p className="font-medium text-gray-900 dark:text-white">{user.email}</p>
                            </div>
                            <div>
                                <span className="text-sm text-gray-600 dark:text-gray-400">User ID:</span>
                                <p className="font-mono text-sm text-gray-900 dark:text-white">{user.id}</p>
                            </div>
                        </div>
                    </div>

                    {/* LINE Notification */}
                    <LineProfileForm
                        userId={user.id}
                        existingLineUserId={lineProfile?.line_user_id}
                    />

                    {/* Language Preference */}
                    <LanguageSetting
                        userId={user.id}
                        currentLanguage={currentLanguage}
                    />

                    {/* Test Section */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                            🧪 Testing
                        </h2>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                            ทดสอบการทำงานของระบบ DCA และ LINE notification
                        </p>
                        <Link
                            href="/test"
                            className="inline-block px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition"
                        >
                            Go to Test Page
                        </Link>
                    </div>
                </div>
            </main>
        </div>
    )
}
