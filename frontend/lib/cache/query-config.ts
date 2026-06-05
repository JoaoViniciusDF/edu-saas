import type { DefaultOptions } from "@tanstack/react-query"

export const STALE_TIME_MS = 5 * 60_000
export const GC_TIME_MS = 24 * 60 * 60_000
export const PERSIST_MAX_AGE_MS = 24 * 60 * 60_000

export const defaultQueryOptions: DefaultOptions = {
  queries: {
    staleTime: STALE_TIME_MS,
    gcTime: GC_TIME_MS,
    retry: 1,
    refetchOnWindowFocus: process.env.NODE_ENV === "production",
    refetchOnReconnect: true,
    placeholderData: (prev: unknown) => prev,
  },
}
