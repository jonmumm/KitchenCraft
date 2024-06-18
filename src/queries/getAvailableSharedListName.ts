import { ListTable } from "@/db";
import { sentenceToSlug } from "@/lib/utils";
import { DbOrTransaction } from "@/types";
import { sql } from "drizzle-orm";

export const getNewSharedListName = async (
  db: DbOrTransaction,
  userId: string,
  timezone: string
): Promise<string> => {
  const formattedDate = getFormattedDate(timezone);
  let baseName = `Shared ${formattedDate}`;
  let listName = baseName;
  let slug = sentenceToSlug(listName);

  let counter = 2;
  while (true) {
    const result = await db
      .select({
        count: sql<number>`COUNT(*)`.mapWith(Number),
      })
      .from(ListTable)
      .where(sql`slug = ${slug} AND created_by = ${userId}`)
      .execute();

    if (result[0]?.count === 0) {
      break;
    }
    listName = `${baseName} (${counter})`;
    slug = sentenceToSlug(listName);
    counter++;
  }

  return listName;
};

const getFormattedDate = (timezone: string) => {
  const today = new Date();
  const options: Intl.DateTimeFormatOptions = {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: timezone,
  };
  return today.toLocaleString("en-US", options);
};
