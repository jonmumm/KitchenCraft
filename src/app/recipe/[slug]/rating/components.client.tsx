"use client";

import { ResponsiveDialog } from "@/components/layout/responsive-dialog";
import { noop } from "@/lib/utils";
import { useStore } from "@nanostores/react";
import { StarIcon } from "lucide-react";
import { atom } from "nanostores";
import { useRouter } from "next/navigation";
import {
  ChangeEventHandler,
  ComponentProps,
  ReactNode,
  useCallback,
  useContext,
  useState,
} from "react";
import { RatingContext } from "./context";
import { RatingValueSchema } from "./schema";
import type { RatingValue } from "./types";

export const RatingProvider = ({
  defaultValue,
  children,
}: {
  defaultValue: RatingValue;
  children: ReactNode;
}) => {
  const [open$] = useState(atom(false));
  const [rating$] = useState(atom<RatingValue>(defaultValue));
  return (
    <RatingContext.Provider
      value={{
        open$,
        rating$,
      }}
    >
      {children}
    </RatingContext.Provider>
  );
};

export const RatingStarIcon = () => {
  const { rating$ } = useContext(RatingContext);
  const value = useStore(rating$);
  return (
    <StarIcon className={`mask mask-star-2 ${value ? `bg-green-500` : ``}`} />
  );

  // className={`bg-green-500 mask mask-star-2 ${
};

export const CurrentRatingValue = () => {
  const { rating$ } = useContext(RatingContext);
  const value = useStore(rating$);
  return value !== 0 ? <>{value}</> : null;
};

export const RatingDialog = (
  props: ComponentProps<typeof ResponsiveDialog>
) => {
  const { open$ } = useContext(RatingContext);
  const open = useStore(open$);

  return <ResponsiveDialog open={open} onOpenChange={open$.set} {...props} />;
};

export const Rating = (props: {
  defaultValue: RatingValue;
  lastRatedAt: Date | undefined;
  submitValueChange?: (value: RatingValue) => Promise<void>;
}) => {
  const router = useRouter();
  const [rating, setRating] = useState(props.defaultValue);
  const [ratedAt, setRatedAt] = useState(props.lastRatedAt);

  // State for the selected rating
  // const { rating$, open$ } = useContext(RatingContext);
  // useSyncExternalStore(
  //   rating$.subscribe,
  //   () => rating$.value,
  //   () => props.defaultValue
  // );

  // Handle change event for radio buttons
  const handleChange: ChangeEventHandler<HTMLInputElement> = useCallback(
    (event) => {
      const newValue = RatingValueSchema.parse(
        parseFloat(event.target.getAttribute("data-value")!)
      );
      setRating(newValue);
      setRatedAt(new Date());

      if (newValue !== 0) {
        // open$.set(false);

        if (props.submitValueChange) {
          props.submitValueChange(newValue).then(noop);
        } else {
          router.push(
            `/auth/signin?message=${encodeURIComponent(
              `An account is required to save your rating.`
            )}&callbackUrl=${encodeURIComponent(window.location.href)}`
          );
        }
      }
    },

    [props.submitValueChange, setRating, router, setRatedAt]
  );
  // const rating = useStore(rating$);

  // Render the component
  return (
    <div className="flex flex-col gap-1 items-center justify-center">
      {typeof ratedAt === "undefined" && (
        <p className="text-center px-5 text-sm">
          How would you rate this recipe?
        </p>
      )}
      {typeof rating !== "undefined" && typeof ratedAt !== "undefined" && (
        <p className="text-center px-5 text-sm font-medium text-muted-foreground">
          Rated {rating}/5 - {formatRatingTime(ratedAt)}
        </p>
      )}
      <div className="rating rating-lg">
        {[0, 1, 2, 3, 4, 5].map((value) => (
          <input
            key={value}
            type="radio"
            name="rating"
            onChange={handleChange}
            data-value={value}
            className={`bg-green-500 mask mask-star-2 ${
              value === 0 ? `rating-hidden` : ``
            }`}
            defaultChecked={rating === value}

            //   onChange={handleChange}
          />
        ))}
      </div>
    </div>
  );
};

function formatRatingTime(date: Date): string {
  const now = new Date();
  const secondsDiff = Math.floor((now.getTime() - date.getTime()) / 1000);

  // For comments posted within the last 60 seconds
  if (secondsDiff < 1) {
    return "just now";
  }
  if (secondsDiff < 601) {
    return "seconds ago";
  }
  if (secondsDiff < 300) {
    return "minutes ago";
  }

  // For older comments, return a formatted date and time string
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
  });
}
