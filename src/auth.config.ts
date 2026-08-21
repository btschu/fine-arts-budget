import type { NextAuthConfig } from "next-auth";
import {
  SESSION_MAX_AGE_SECONDS,
  SESSION_UPDATE_AGE_SECONDS,
} from "@/lib/sessionConfig";

// Shared, dependency-light config used by both the full auth setup (auth.ts)
// and the proxy (proxy.ts). Keeping this free of bcrypt/Prisma/pg matters:
// proxy.ts runs on every request in a minimal function, and bundling
// Node-native DB drivers into it breaks on some hosts.
export const authConfig: NextAuthConfig = {
  session: {
    strategy: "jwt",
    // Signs a user out after an hour of no activity. Each request more
    // than updateAge into the session re-issues the token, so this is
    // an idle timeout, not a hard expiry from login time.
    maxAge: SESSION_MAX_AGE_SECONDS,
    updateAge: SESSION_UPDATE_AGE_SECONDS,
  },
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
