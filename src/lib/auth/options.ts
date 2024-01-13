// Inspired from https://www.ramielcreations.com/nexth-auth-magic-code

import { UsersTable, db } from "@/db";
import { privateEnv } from "@/env.secrets";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { eq } from "drizzle-orm";
import { NextAuthOptions } from "next-auth";
import Email from "next-auth/providers/email";
import GoogleProvider from "next-auth/providers/google";
import { resend } from "../resend";

function generateLoginCode(): string {
  const characters = "ABCDEFGHJKLMNPQRSTUVWXYZ"; // Avoid confusing characters
  let code = "";
  for (let i = 0; i < 5; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    code += characters[randomIndex];
  }
  return code;
}

export const adapter = DrizzleAdapter(db);

export const emailConfig = Email({
  from: "KitchenCraft <signin@mail.kitchencraft.ai>",
  maxAge: 5 * 60, // 5 minutes
  sendVerificationRequest: async ({
    identifier: email,
    url,
    token,
    provider,
  }) => {
    const result = await resend.emails.send({
      from: "KitchenCraft <signin@mail.kitchencraft.ai>",
      to: email,
      subject: "Your Sign-In Code",
      text: `To sign-in to KitchenCraft, enter this code: ${token}. This code will expire in 5 minutes.`,
      html: `<div><p>To sign-in to KitchenCraft, enter this code:</p><p>${token}</p><p>This code will expire in 5 minutes.</p></div>`,
    });
    if (result.error) {
      throw new Error(result.error.message);
    }
  },
  generateVerificationToken: async () => {
    const token = await generateLoginCode();
    return token;
  },
});

export const authOptions: NextAuthOptions = {
  adapter,
  session: {
    strategy: "jwt",
  },
  secret: privateEnv.NEXTAUTH_SECRET,
  pages: {
    signIn: "/auth/signin",
  },
  providers: [
    emailConfig,
    GoogleProvider({
      clientId: privateEnv.GOOGLE_CLIENT_ID,
      clientSecret: privateEnv.GOOGLE_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    async signIn(params) {
      return true;
    },

    // e.g. getSession(), useSession(), /api/auth/session
    async session(params) {
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
      if (params.trigger === "signUp") {
        // sign up hook here...
      }

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
