// https://twitter.com/borispoehland/status/1736458539818729828

import {
  ElementRef,
  ForwardRefExoticComponent,
  createElement,
  forwardRef,
} from "react";
import { cn } from "./utils";

export function extend<T extends { className?: string }>(
  Component: ForwardRefExoticComponent<T>,
  defaultProps: T
) {
  return forwardRef<ElementRef<typeof Component>, T>(
    function ExtendComponent(props, ref) {
      return (
        <Component
          ref={ref}
          {...defaultProps}
          {...props}
          className={cn(defaultProps.className, props.className)}
        />
      );
    }
  );
}

export function create<T extends keyof HTMLElementTagNameMap>(tag: T) {
  return forwardRef<HTMLElementTagNameMap[T], JSX.IntrinsicElements[T]>(
    function CreateComponent(props, ref) {
      return createElement(tag, { ...props, ref });
    }
  );
}
