import { UsersTable, db } from "@/db";
import { privateEnv } from "@/env.secrets";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { eq } from "drizzle-orm";
import { NextAuthOptions } from "next-auth";
import Email from "next-auth/providers/email";
import GoogleProvider from "next-auth/providers/google";
import { Resend } from "resend";

const resend = new Resend(privateEnv.RESEND_API_KEY);

function generateLoginCode(): string {
  const characters = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Avoid confusing characters
  let code = "";
  for (let i = 0; i < 5; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    code += characters[randomIndex];
  }
  return code;
}

export const authOptions: NextAuthOptions = {
  adapter: DrizzleAdapter(db),
  session: {
    strategy: "jwt",
  },
  secret: privateEnv.NEXTAUTH_SECRET,
  pages: {
    signIn: "/auth/signin",
  },
  providers: [
    Email({
      from: "auth@kitchencraft.ai",
      maxAge: 5 * 60, // 5 minutes
      sendVerificationRequest: async ({
        identifier: email,
        url,
        token,
        provider,
      }) => {
        const result = await resend.emails.send({
          from: "KitchenCraft <onboarding@resend.dev>",
          // from: "KitchenCraft <signin@kitchencraft.ai>",
          to: email,
          subject: "Your Sign-In Code",
          html: `<p>To sign-in to KitchenCraft, enter this code: ${token}</p>`,
        });
        if (result.error) {
          throw new Error(result.error.message);
        }
      },
      generateVerificationToken: async () => {
        const token = await generateLoginCode();
        return token;
      },
    }),
    GoogleProvider({
      clientId: privateEnv.GOOGLE_CLIENT_ID,
      clientSecret: privateEnv.GOOGLE_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    async signIn(params) {
      // console.log("sign in", params);
      return true;
    },

    // e.g. getSession(), useSession(), /api/auth/session
    async session(params) {
      // console.log("session", params);
      const { token, session } = params;
      if (session.user && token) {
        session.user.id = token.id;
        session.user.name = token.name;
        session.user.email = token.email;
        session.user.image = token.picture;
        return session;
      } else {
        throw new Error("expected token and user in session");
      }
    },

    // this data can become available to the browser
    async jwt(params) {
      // console.log("jwt", params);
      const { token, user } = params;
      const [dbUser] = await db
        .select()
        .from(UsersTable)
        .where(eq(UsersTable.email, token.email || ""))
        .limit(1);

      if (!dbUser) {
        if (user) {
          token.id = user?.id;
        }
        return token;
      }

      return {
        id: dbUser.id,
        name: dbUser.name,
        email: dbUser.email,
        picture: dbUser.image,
      };
    },
  },
};

// export const authOptions: NextAuthOptions = {
//   adapter: DrizzleAdapter(db),
//   providers: [
//     GoogleProvider({
//       clientId: privateEnv.GOOGLE_CLIENT_ID,
//       clientSecret: privateEnv.GOOGLE_CLIENT_SECRET,
//     }),
//   ],
//   // callbacks: {
//   //   async redirect({ url, baseUrl }) {
//   //     // Allows relative callback URLs
//   //     if (url.startsWith("/")) return `${baseUrl}${url}`;
//   //     // Allows callback URLs on the same origin
//   //     else if (new URL(url).origin === baseUrl) return url;
//   //     return baseUrl;
//   //   },
//   //   signIn(params) {
//   //     return true;
//   //   },

//   //   session({ session, token, user }) {
//   //     console.log(session, token, user);
//   //     return {
//   //       ...session,
//   //       user: {
//   //         ...session.user,
//   //         username: token.username,
//   //       } as User,
//   //     };
//   //   },

//   //   jwt({ token, profile, trigger }) {
//   //     const username =
//   //       profile && "login" in profile ? profile.login : profile?.email;

//   //     if (trigger === "signIn") {
//   //       return { ...token, username };
//   //     }

//   //     return token;
//   //   },
//   // },
// };
