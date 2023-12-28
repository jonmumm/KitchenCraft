import { kv } from "@/lib/kv";

// Function to update mediaCount
async function updateUpvotes() {
  try {
    const keys = await kv.keys("recipe:*");

    for (const key of keys) {
      if (!key.includes(":media")) {
        await kv.hset(key, {
          upvotes: 0,
        });
      }
    }
    console.log("Upvotes updated successfully.");
  } catch (error) {
    console.error("Error updating upvotes:", error);
  }
}

// Execute the script
updateUpvotes();
