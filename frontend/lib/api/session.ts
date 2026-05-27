export const COOKIE_ACCESS = "edu_access"
export const COOKIE_REFRESH = "edu_refresh"

export const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
}
