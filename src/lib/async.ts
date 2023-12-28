export async function waitForConditionWithBackoff<T>(
  fetchPromise: () => Promise<T>,
  checkCondition: (data: T) => boolean,
  timeoutMs: number = 10000, // Default timeout set to 10000 milliseconds (10 seconds)
  maxIntervalMs: number = 2000
): Promise<T> {
  let timeoutReached = false;
  let attempt = 0;

  // Set a timeout to mark when the time limit is reached
  const timeout = setTimeout(() => {
    timeoutReached = true;
  }, timeoutMs);

  const calculateBackoffInterval = (attempt: number): number => {
    const baseInterval = Math.pow(2, attempt) * 100; // exponential backoff
    return Math.min(baseInterval, maxIntervalMs);
  };

  try {
    while (!timeoutReached) {
      const data = await fetchPromise();
      if (checkCondition(data)) {
        return data; // Condition met, return data
      }

      attempt++;
      const interval = calculateBackoffInterval(attempt);
      // Wait for the calculated backoff interval before the next attempt
      await new Promise((resolve) => setTimeout(resolve, interval));
    }
    throw new Error("Timeout reached while waiting for condition to be met");
  } finally {
    clearTimeout(timeout); // Clear the timeout to prevent memory leaks
  }
}
