/**
 * Debug logging utility that only outputs in development
 */
export function debug(message: string, ...args: unknown[]) {
    if (process.env.NODE_ENV === "development") {
        console.log(`[debug] ${message}`, ...args)
    }
}

/**
 * Debug warning utility that only outputs in development
 */
export function debugWarn(message: string, ...args: unknown[]) {
    if (process.env.NODE_ENV === "development") {
        console.warn(`[warn] ${message}`, ...args)
    }
}

/**
 * Debug error utility that only outputs in development
 */
export function debugError(message: string, ...args: unknown[]) {
    if (process.env.NODE_ENV === "development") {
        console.error(`[error] ${message}`, ...args)
    }
}
