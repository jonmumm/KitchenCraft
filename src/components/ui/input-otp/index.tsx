"use client"

import * as React from "react"
import { OTPInput, OTPInputContext, REGEXP_ONLY_DIGITS_AND_CHARS, SlotProps } from "input-otp"
import { Dot } from "lucide-react"

import { cn } from "@/lib/utils"

const InputOTP = React.forwardRef<
  React.ElementRef<typeof OTPInput>,
  React.ComponentPropsWithoutRef<typeof OTPInput>
>(({ className, containerClassName, ...props }, ref) => (
  <OTPInput
    ref={ref}
    containerClassName={cn(
      "flex items-center gap-2 has-[:disabled]:opacity-50",
      containerClassName
    )}
    className={cn("disabled:cursor-not-allowed", className)}
    {...props}
  />
))
InputOTP.displayName = "InputOTP"

const InputOTPGroup = React.forwardRef<
  React.ElementRef<"div">,
  React.ComponentPropsWithoutRef<"div">
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("flex items-center", className)} {...props} />
))
InputOTPGroup.displayName = "InputOTPGroup"

const InputOTPSlot = React.forwardRef<
  React.ElementRef<"div">,
  React.ComponentPropsWithoutRef<"div"> & { index: number }
>(({ index, className, ...props }, ref) => {
  const inputOTPContext = React.useContext(OTPInputContext)
  const { char, hasFakeCaret, isActive } = inputOTPContext.slots[index] as SlotProps

  return (
    <div
      ref={ref}
      className={cn(
        "relative flex h-10 w-10 items-center justify-center border-y border-r border-input text-sm transition-all first:rounded-l-md first:border-l last:rounded-r-md",
        isActive && "z-10 ring-2 ring-ring ring-offset-background",
        className
      )}
      {...props}
    >
      {char}
      {hasFakeCaret && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-4 w-px animate-caret-blink bg-foreground duration-1000" />
        </div>
      )}
    </div>
  )
})
InputOTPSlot.displayName = "InputOTPSlot"

const InputOTPSeparator = React.forwardRef<
  React.ElementRef<"div">,
  React.ComponentPropsWithoutRef<"div">
>(({ ...props }, ref) => (
  <div ref={ref} role="separator" {...props}>
    <Dot />
  </div>
))
InputOTPSeparator.displayName = "InputOTPSeparator"

interface InputProps {
  id: string,
  autoFocus: boolean,
  maxLength: number,
  disabled: boolean,
  onChange: (value: string) => void,
  onPaste: React.ClipboardEventHandler<HTMLInputElement>,
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      id,
      autoFocus,
      maxLength,
      disabled,
      onChange,
      onPaste,
      ...restProps
    },
    ref
  ) => (
    <InputOTP
      id={id}
      autoFocus={autoFocus}
      maxLength={maxLength}
      disabled={disabled}
      onChange={onChange}
      onPaste={onPaste}
      pattern={REGEXP_ONLY_DIGITS_AND_CHARS}
      ref={ref}
      {...restProps}
    >
      <InputOTPGroup>
        {(() => {
          const slots = [];
          for (let i = 0; i < 5; i++) {
            slots.push(<InputOTPSlot key={i} index={i} />);
          }
          return slots;
        })()}
      </InputOTPGroup>
    </InputOTP>
  )
);

Input.displayName = "Input";

export { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator, Input }
