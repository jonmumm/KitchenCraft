"use client";

import { ResponsiveDialog } from "@/components/layout/responsive-dialog";
import { noop } from "@/lib/utils";
import { useStore } from "@nanostores/react";
import { StarIcon } from "lucide-react";
import { atom } from "nanostores";
import {
  ChangeEventHandler,
  ComponentProps,
  ReactNode,
  useCallback,
  useContext,
  useState,
  useSyncExternalStore,
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
  submitValueChange: (value: RatingValue) => Promise<void>;
}) => {
  // State for the selected rating
  const { rating$, open$ } = useContext(RatingContext);
  useSyncExternalStore(
    rating$.subscribe,
    () => rating$.value,
    () => props.defaultValue
  );

  // Handle change event for radio buttons
  const handleChange: ChangeEventHandler<HTMLInputElement> = useCallback(
    (event) => {
      const newValue = RatingValueSchema.parse(
        parseFloat(event.target.getAttribute("data-value")!)
      );
      rating$.set(newValue);

      if (newValue !== 0) {
        open$.set(false);

        props.submitValueChange(newValue).then(noop);
      }
    },

    [props.submitValueChange, rating$, open$]
  );
  const rating = useStore(rating$);

  // Render the component
  return (
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
  );
};
