'use client'

export default function AIThinkingStep() {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-12">
            <div className="flex flex-col items-center justify-center">
                {/* Animated Icon */}
                <div className="relative">
                    <div className="w-24 h-24 border-8 border-blue-200 dark:border-blue-900 border-t-blue-600 rounded-full animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center text-4xl">
                        🤖
                    </div>
                </div>

                {/* Text */}
                <h3 className="mt-8 text-2xl font-bold text-gray-900 dark:text-white">
                    AI is Analyzing...
                </h3>
                <p className="mt-2 text-gray-600 dark:text-gray-400 text-center max-w-md">
                    Our AI is analyzing market data and selecting the best stocks for your DCA portfolio
                </p>

                {/* Progress Messages */}
                <div className="mt-8 space-y-2 text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                        <span>Analyzing market conditions...</span>
                    </div>
                    <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                        <span>Evaluating stock fundamentals...</span>
                    </div>
                    <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                        <span>Calculating optimal weights...</span>
                    </div>
                </div>
            </div>
        </div>
    )
}
