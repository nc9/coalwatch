export default function Loading() {
    return (
        <div className="min-h-screen flex items-center justify-center p-8">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-white mx-auto mb-4"></div>
                <p className="text-gray-600 dark:text-gray-400">
                    Loading facility data...
                </p>
            </div>
        </div>
    )
}
