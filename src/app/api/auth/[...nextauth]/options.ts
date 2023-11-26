import { privateEnv } from "@/env.secrets";
import GoogleProvider from "next-auth/providers/google";
import { NextAuthOptions } from "next-auth";

type User = {
  username: string;
  name?: string;
  email?: string;
  image?: string;
  expires?: string;
};

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: privateEnv.GOOGLE_CLIENT_ID,
      clientSecret: privateEnv.GOOGLE_CLIENT_SECRET,
    }),
    // GitHubProvider({
    //   clientId: GITHUB_CLIENT_ID,
    //   clientSecret: GITHUB_SECRET,
    // }),
  ],
  callbacks: {
    async redirect({ url, baseUrl }) {
      // Allows relative callback URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      // Allows callback URLs on the same origin
      else if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
    signIn(params) {
      return true;
    },

    session({ session, token, user }) {
      return {
        ...session,
        user: {
          ...session.user,
          username: token.username,
        } as User,
      };
    },

    jwt({ token, profile, trigger }) {
      const username =
        profile && "login" in profile ? profile.login : profile?.email;

      if (trigger === "signIn") {
        return { ...token, username };
      }

      return token;
    },
  },
};
