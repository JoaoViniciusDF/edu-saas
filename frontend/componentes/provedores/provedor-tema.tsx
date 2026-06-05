"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"

/** Evita aviso do React 19 sobre `<script>` no client; o script de SSR ainda roda antes da hidratação. */
const scriptPropsReact19 = { type: "application/json" as const }

export function ProvedorTema({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider {...props} scriptProps={scriptPropsReact19}>
      {children}
    </NextThemesProvider>
  )
}
