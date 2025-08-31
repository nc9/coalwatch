"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

export function ViewTabs() {
  const pathname = usePathname()
  const isHistory = pathname === "/history"

  return (
    <div className="flex justify-center mb-8">
      <div className="inline-flex rounded-lg bg-neutral-900 p-1">
        <Link
          href="/"
          className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
            !isHistory
              ? "bg-neutral-700 text-neutral-100"
              : "text-neutral-400 hover:text-neutral-200"
          }`}
        >
          Current
        </Link>
        <Link
          href="/history"
          className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
            isHistory
              ? "bg-neutral-700 text-neutral-100"
              : "text-neutral-400 hover:text-neutral-200"
          }`}
        >
          Historic
        </Link>
      </div>
    </div>
  )
}