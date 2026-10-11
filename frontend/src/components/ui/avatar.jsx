import React from "react";
import { cn } from "../../lib/utils";

export const Avatar = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full ring-2 ring-white shadow-xs",
      className
    )}
    {...props}
  />
));
Avatar.displayName = "Avatar";

export const AvatarImage = React.forwardRef(({ className, src, alt, ...props }, ref) => {
  if (!src) return null;
  return (
    <img
      ref={ref}
      src={src}
      alt={alt}
      className={cn("aspect-square h-full w-full object-cover", className)}
      {...props}
    />
  );
});
AvatarImage.displayName = "AvatarImage";

export const AvatarFallback = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex h-full w-full items-center justify-center rounded-full bg-brand-100 text-brand-700 font-bold text-xs uppercase",
      className
    )}
    {...props}
  />
));
AvatarFallback.displayName = "AvatarFallback";
