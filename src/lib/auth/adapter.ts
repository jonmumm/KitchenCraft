// // From: https://github.com/nextauthjs/next-auth/blob/main/packages/adapter-drizzle/src/lib/pg.ts
// import { and, eq } from "drizzle-orm";
// import { PgDatabase, pgTable as defaultPgTableFn } from "drizzle-orm/pg-core";

// import {
//   AccountsTable,
//   SessionsTable,
//   UsersTable,
//   VerificationTokensTable,
// } from "@/db";
// import type { Adapter } from "@auth/core/adapters";

// export type DefaultSchema = {
//   users: typeof UsersTable;
//   accounts: typeof AccountsTable;
//   sessions: typeof SessionsTable;
//   verificationTOkens: typeof VerificationTokensTable;
// };

// export function pgDrizzleAdapter(
//   client: InstanceType<typeof PgDatabase>
//   //   tableFn = defaultPgTableFn
// ): Adapter {
//   return {
//     async createUser(data) {
//       return await client
//         .insert(UsersTable)
//         .values({ ...data, id: crypto.randomUUID() })
//         .returning()
//         .then((res) => res[0] ?? null);
//     },
//     async getUser(data) {
//       return await client
//         .select()
//         .from(UsersTable)
//         .where(eq(UsersTable.id, data))
//         .then((res) => res[0] ?? null);
//     },
//     async getUserByEmail(data) {
//       return await client
//         .select()
//         .from(UsersTable)
//         .where(eq(UsersTable.email, data))
//         .then((res) => res[0] ?? null);
//     },
//     async createSession(data) {
//       return await client
//         .insert(SessionsTable)
//         .values(data)
//         .returning()
//         .then((res) => res[0]);
//     },
//     async getSessionAndUser(data) {
//       return await client
//         .select({
//           session: SessionsTable,
//           user: UsersTable,
//         })
//         .from(SessionsTable)
//         .where(eq(SessionsTable.sessionToken, data))
//         .innerJoin(UsersTable, eq(UsersTable.id, SessionsTable.userId))
//         .then((res) => res[0] ?? null);
//     },
//     async updateUser(data) {
//       if (!data.id) {
//         throw new Error("No user id.");
//       }

//       return await client
//         .update(UsersTable)
//         .set(data)
//         .where(eq(UsersTable.id, data.id))
//         .returning()
//         .then((res) => res[0]);
//     },
//     async updateSession(data) {
//       return await client
//         .update(SessionsTable)
//         .set(data)
//         .where(eq(SessionsTable.sessionToken, data.sessionToken))
//         .returning()
//         .then((res) => res[0]);
//     },
//     async linkAccount(rawAccount) {
//       const updatedAccount = await client
//         .insert(AccountsTable)
//         .values(rawAccount)
//         .returning()
//         .then((res) => res[0]);

//       // Drizzle will return `null` for fields that are not defined.
//       // However, the return type is expecting `undefined`.
//       const account = {
//         ...updatedAccount,
//         access_token: updatedAccount.access_token ?? undefined,
//         token_type: updatedAccount.token_type ?? undefined,
//         id_token: updatedAccount.id_token ?? undefined,
//         refresh_token: updatedAccount.refresh_token ?? undefined,
//         scope: updatedAccount.scope ?? undefined,
//         expires_at: updatedAccount.expires_at ?? undefined,
//         session_state: updatedAccount.session_state ?? undefined,
//       };

//       return account;
//     },
//     async getUserByAccount(account) {
//       const dbAccount =
//         (await client
//           .select()
//           .from(AccountsTable)
//           .where(
//             and(
//               eq(AccountsTable.providerAccountId, account.providerAccountId),
//               eq(AccountsTable.provider, account.provider)
//             )
//           )
//           .leftJoin(UsersTable, eq(AccountsTable.userId, UsersTable.id))
//           .then((res) => res[0])) ?? null;

//       if (!dbAccount) {
//         return null;
//       }

//       return dbAccount.user;
//     },
//     async deleteSession(sessionToken) {
//       const session = await client
//         .delete(SessionsTable)
//         .where(eq(SessionsTable.sessionToken, sessionToken))
//         .returning()
//         .then((res) => res[0] ?? null);

//       return session;
//     },
//     async createVerificationToken(token) {
//       return await client
//         .insert(VerificationTokensTable)
//         .values(token)
//         .returning()
//         .then((res) => res[0]);
//     },
//     async useVerificationToken(token) {
//       try {
//         return await client
//           .delete(VerificationTokensTable)
//           .where(
//             and(
//               eq(VerificationTokensTable.identifier, token.identifier),
//               eq(VerificationTokensTable.token, token.token)
//             )
//           )
//           .returning()
//           .then((res) => res[0] ?? null);
//       } catch (err) {
//         throw new Error("No verification token found.");
//       }
//     },
//     async deleteUser(id) {
//       await client
//         .delete(UsersTable)
//         .where(eq(UsersTable.id, id))
//         .returning()
//         .then((res) => res[0] ?? null);
//     },
//     async unlinkAccount(account) {
//       const { type, provider, providerAccountId, userId } = await client
//         .delete(AccountsTable)
//         .where(
//           and(
//             eq(AccountsTable.providerAccountId, account.providerAccountId),
//             eq(AccountsTable.provider, account.provider)
//           )
//         )
//         .returning()
//         .then((res) => res[0] ?? null);

//       return { provider, type, providerAccountId, userId };
//     },
//   };
// }
