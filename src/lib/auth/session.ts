import { getServerSession } from "next-auth";
import { authOptions } from "./options";

export const getSession = () => getServerSession(authOptions);

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
