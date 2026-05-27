import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { COOKIE_ACCESS } from "@/lib/api/session"

export default async function HomePage() {
  const jar = await cookies()
  if (!jar.get(COOKIE_ACCESS)?.value) {
    redirect("/login")
  }
  redirect("/conteudo")
}
