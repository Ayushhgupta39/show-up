import { auth } from "@/lib/auth/auth"

export default auth((req) => {
  // Middleware logic handled by authConfig.callbacks.authorized
})

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
