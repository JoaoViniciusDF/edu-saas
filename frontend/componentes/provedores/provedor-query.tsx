"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import type { ReactNode } from "react"
import * as React from "react"

function makeClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        retry: 1,
      },
    },
  })
}

export function ProvedorQuery({ children }: { children: ReactNode }) {
  const [client] = React.useState(makeClient)
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}
