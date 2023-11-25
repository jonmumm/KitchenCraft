import { kv } from "@vercel/kv";

// Function to update mediaCount
async function updateMediaCounts() {
  try {
    const keys = await kv.keys("recipe:*");

    for (const key of keys) {
      if (!key.includes(":media")) {
        let mediaCount = 0;
        try {
          mediaCount = await kv.llen(`${key}:media`);
        } catch (ex) {
          // ignore
        }
        console.log({ mediaCount, key });
        await kv.hset(key, {
          mediaCount,
        });
      }
    }
    console.log("Media counts updated successfully.");
  } catch (error) {
    console.error("Error updating media counts:", error);
  }
}

// Execute the script
updateMediaCounts();
