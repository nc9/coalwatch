"use client"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex min-h-screen items-center justify-center p-8">
      <div className="text-center">
        <h2 className="mb-4 text-xl font-bold">Something went wrong!</h2>
        <p className="mb-4 text-gray-600 dark:text-gray-400">{error.message}</p>
        <button
          onClick={reset}
          className="rounded bg-blue-500 px-4 py-2 text-white transition-colors hover:bg-blue-600"
        >
          Try again
        </button>
      </div>
    </div>
  )
}
