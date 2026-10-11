import React, { createContext, useContext, useState } from "react";
import { cn } from "../../lib/utils";

const TabsContext = createContext({
  value: "",
  onValueChange: () => {},
});

export const Tabs = ({ value, defaultValue, onValueChange, className, children, ...props }) => {
  const [internalValue, setInternalValue] = useState(defaultValue || "");
  const currentValue = value !== undefined ? value : internalValue;
  const handleValueChange = onValueChange || setInternalValue;

  return (
    <TabsContext.Provider value={{ value: currentValue, onValueChange: handleValueChange }}>
      <div className={cn("w-full space-y-4", className)} {...props}>
        {children}
      </div>
    </TabsContext.Provider>
  );
};

export const TabsList = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "inline-flex h-10 items-center justify-center rounded-full bg-slate-100 p-1 text-slate-500",
      className
    )}
    {...props}
  />
));
TabsList.displayName = "TabsList";

export const TabsTrigger = React.forwardRef(({ className, value, ...props }, ref) => {
  const { value: selectedValue, onValueChange } = useContext(TabsContext);
  const isSelected = selectedValue === value;

  return (
    <button
      ref={ref}
      type="button"
      onClick={() => onValueChange(value)}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-semibold ring-offset-white transition-all focus-visible:outline-none cursor-pointer",
        isSelected
          ? "bg-white text-brand-700 shadow-xs font-bold"
          : "text-slate-600 hover:text-slate-900",
        className
      )}
      {...props}
    />
  );
});
TabsTrigger.displayName = "TabsTrigger";

export const TabsContent = React.forwardRef(({ className, value, ...props }, ref) => {
  const { value: selectedValue } = useContext(TabsContext);
  if (selectedValue !== value) return null;

  return (
    <div
      ref={ref}
      className={cn(
        "mt-2 ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500",
        className
      )}
      {...props}
    />
  );
});
TabsContent.displayName = "TabsContent";
