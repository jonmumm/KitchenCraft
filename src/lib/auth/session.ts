import { getServerSession } from "next-auth";
import { eq } from "drizzle-orm";
import { authOptions } from "./options";
import { db } from "@/db";
import { UsersTable } from "@/db/schema";

export const getSession = async () => {
  const session = await getServerSession(authOptions);

  return session;
};

// export const getCurrentUser = async () => {
//   const session = await getServerSession(authOptions);

//   if (!session) {
//     return null;
//   }

//   const [currentUser] = await db
//     .select({
//       userId: UsersTable.id,
//       email: UsersTable.email,
//       name: UsersTable.name,
//       image: UsersTable.image,
//       createdAt: UsersTable.createdAt,
//     })
//     .from(UsersTable)
//     .where(eq(UsersTable.id, session.user.));

//   return currentUser;
// };
