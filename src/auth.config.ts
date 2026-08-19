import type { NextAuthConfig } from "next-auth";

// Shared, dependency-light config used by both the full auth setup (auth.ts)
// and the proxy (proxy.ts). Keeping this free of bcrypt/Prisma/pg matters:
// proxy.ts runs on every request in a minimal function, and bundling
// Node-native DB drivers into it breaks on some hosts.
export const authConfig: NextAuthConfig = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [],
  callbacks: {
    jwt({ token, user }) {
      if (user) token.id = user.id as string;
      return token;
    },
    session({ session, token }) {
      if (session.user) session.user.id = token.id as string;
      return session;
    },
  },
};
