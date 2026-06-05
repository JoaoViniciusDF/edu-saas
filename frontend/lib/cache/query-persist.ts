"use client"

import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister"
import { queryDevePersistir } from "./query-keys"
import { PERSIST_MAX_AGE_MS } from "./query-config"

const STORAGE_KEY = "edu-saas-query-cache"

export function createQueryPersister() {
  if (typeof window === "undefined") return undefined
  return createSyncStoragePersister({
    storage: window.localStorage,
    key: STORAGE_KEY,
  })
}

export const persistOptions = {
  maxAge: PERSIST_MAX_AGE_MS,
  dehydrateOptions: {
    shouldDehydrateQuery: (query: { queryKey: readonly unknown[] }) =>
      queryDevePersistir(query.queryKey),
  },
}
