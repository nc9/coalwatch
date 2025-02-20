export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center p-8">
      <div className="text-center">
        <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-gray-900 dark:border-white"></div>
        <p className="text-gray-600 dark:text-gray-400">
          Loading facility data...
        </p>
      </div>
    </div>
  )
}
