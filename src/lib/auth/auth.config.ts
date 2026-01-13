import type { NextAuthConfig } from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { loginSchema } from "@/lib/validations/auth"

export const authConfig: NextAuthConfig = {
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const validatedFields = loginSchema.safeParse(credentials)

        if (!validatedFields.success) {
          return null
        }

        const { email, password } = validatedFields.data

        // Lazy load prisma and bcrypt to avoid edge runtime issues
        const { default: prisma } = await import("@/lib/db/prisma")
        const bcryptModule = await import("bcryptjs")

        const user = await prisma.user.findUnique({
          where: { email },
        })

        if (!user || !user.password) {
          return null
        }

        const passwordsMatch = await bcryptModule.compare(password, user.password)

        if (!passwordsMatch) {
          return null
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          timezone: user.timezone,
        }
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const isOnDashboard =
        nextUrl.pathname.startsWith("/dashboard") ||
        nextUrl.pathname.startsWith("/group")
      const isOnAuth =
        nextUrl.pathname.startsWith("/login") ||
        nextUrl.pathname.startsWith("/signup")

      if (isOnDashboard) {
        if (isLoggedIn) return true
        return false // Redirect to login
      } else if (isOnAuth) {
        if (isLoggedIn)
          return Response.redirect(new URL("/dashboard", nextUrl))
        return true
      }

      return true
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.timezone = user.timezone
      }
      return token
    },
    session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.timezone = token.timezone as string
      }
      return session
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.AUTH_SECRET,
}
