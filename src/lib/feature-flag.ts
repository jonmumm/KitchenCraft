import { context, trace } from "@opentelemetry/api";
import { posthog } from "./posthog";
import { withSpan } from "./observability";

interface FeatureFlagOptions {
  personProperties: Record<string, string>;
}

/**
 * Evaluates a feature flag and records the result as an event in the active span.
 *
 * @param flagKey - The key of the feature flag.
 * @param distinctId - The distinct identifier for the user.
 * @param options - Additional options for the feature flag evaluation.
 * @returns A promise that resolves to the result of the feature flag evaluation.
 */
export async function evaluateFeatureFlag(
  flagKey: string,
  distinctId: string,
  options: FeatureFlagOptions
): Promise<boolean> {
  // Perform the feature flag evaluation
  const isFlagEnabled = await withSpan(
    posthog.isFeatureEnabled(flagKey, distinctId, options),
    `evaluateFeatureFlag ${flagKey} ${distinctId}`
  );

  // Get the current active span
  const currentSpan = trace.getSpan(context.active());

  // Record the feature flag evaluation as an event if a span is active
  if (currentSpan) {
    currentSpan.addEvent("feature_flag", {
      "feature_flag.key": flagKey,
      "feature_flag.provider_name": "PostHog", // Update as needed
      "feature_flag.variant": isFlagEnabled,
    });
  }

  return isFlagEnabled || false;
}
