"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client"
import type { ReactNode } from "react"
import * as React from "react"
import { defaultQueryOptions } from "@/lib/cache/query-config"
import { createQueryPersister, persistOptions } from "@/lib/cache/query-persist"

function makeClient() {
  return new QueryClient({ defaultOptions: defaultQueryOptions })
}

export function ProvedorQuery({ children }: { children: ReactNode }) {
  const [client] = React.useState(makeClient)
  const persister = React.useMemo(() => createQueryPersister(), [])

  if (!persister) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>
  }

  return (
    <PersistQueryClientProvider
      client={client}
      persistOptions={{ ...persistOptions, persister }}
    >
      {children}
    </PersistQueryClientProvider>
  )
}
