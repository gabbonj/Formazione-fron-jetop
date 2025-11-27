import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { API_BASE } from "@/lib/api";

export default NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
        token: { label: "Token", type: "text" },
      },
      async authorize(credentials) {
        // If a token is provided directly, accept it and build a user object
        if (credentials?.token) {
          try {
            const t = credentials.token as string;
            // Try to decode token payload to extract a user id/name if present
            let uid: string | null = null;
            let name: string | null = null;
            try {
              const parts = t.split('.');
              if (parts.length >= 2) {
                const payload = parts[1];
                const b64 = payload.replace(/-/g, '+').replace(/_/g, '/');
                const json = decodeURIComponent(
                  Buffer.from(b64, 'base64').toString('binary')
                    .split('')
                    .map(function (c) {
                      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
                    })
                    .join('')
                );
                const obj = JSON.parse(json);
                uid = obj.sub || obj.user_id || obj.id || obj.uid || null;
                name = obj.name || obj.username || null;
              }
            } catch (e) {
              // ignore
            }
            return { id: uid || undefined, name: name || undefined, token: t } as any;
          } catch (e) {
            return null;
          }
        }

        // Otherwise try to login using username/password against the backend
        if (credentials?.username && credentials?.password) {
          try {
            const res = await fetch(`${API_BASE}/api/auth/login`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ username: credentials.username, password: credentials.password }),
            });
            const data = await res.json();
            if (!res.ok) return null;
            // If backend indicates requires_otp, return null so caller can handle OTP flow
            if (data?.requires_otp) return null;
            if (data?.token) {
              return { id: data?.user?.id || undefined, name: data?.user?.username || undefined, token: data.token } as any;
            }
            return null;
          } catch (e) {
            return null;
          }
        }

        return null;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // If user just signed in, persist the token
      if (user && (user as any).token) {
        token.accessToken = (user as any).token;
      }
      return token;
    },
    async session({ session, token }) {
      // Expose accessToken on the client session object
      (session as any).token = (token as any).accessToken;
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET || 'development-secret',
});
