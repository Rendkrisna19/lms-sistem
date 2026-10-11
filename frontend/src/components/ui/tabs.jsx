import React, { createContext, useContext, useId, useState } from "react";
import { cn } from "../../lib/utils";

const TabsContext = createContext({ value: "", onValueChange: () => {}, baseId: "" });

const tabId = (baseId, value) => `${baseId}-tab-${value}`;
const panelId = (baseId, value) => `${baseId}-panel-${value}`;

export const Tabs = ({ value, defaultValue, onValueChange, className, children, ...props }) => {
  const [internalValue, setInternalValue] = useState(defaultValue || "");
  const baseId = useId();
  const currentValue = value !== undefined ? value : internalValue;
  const handleValueChange = onValueChange || setInternalValue;

  return (
    <TabsContext.Provider value={{ value: currentValue, onValueChange: handleValueChange, baseId }}>
      <div className={cn("w-full space-y-4", className)} {...props}>
        {children}
      </div>
    </TabsContext.Provider>
  );
};

export const TabsList = React.forwardRef(({ className, ...props }, ref) => {
  // Navigasi panah kiri/kanan antar tab
  const handleKeyDown = (event) => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    const tabs = [...event.currentTarget.querySelectorAll('[role="tab"]:not([disabled])')];
    const index = tabs.indexOf(document.activeElement);
    if (index === -1) return;
    event.preventDefault();
    const next =
      event.key === "Home" ? 0 : event.key === "End" ? tabs.length - 1 : (index + (event.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length;
    tabs[next].focus();
    tabs[next].click();
  };

  return (
    <div
      ref={ref}
      role="tablist"
      onKeyDown={handleKeyDown}
      className={cn("inline-flex h-10 items-center justify-center rounded-full bg-slate-100 p-1 text-slate-500", className)}
      {...props}
    />
  );
});
TabsList.displayName = "TabsList";

export const TabsTrigger = React.forwardRef(({ className, value, ...props }, ref) => {
  const { value: selectedValue, onValueChange, baseId } = useContext(TabsContext);
  const isSelected = selectedValue === value;

  return (
    <button
      ref={ref}
      type="button"
      role="tab"
      id={tabId(baseId, value)}
      aria-selected={isSelected}
      aria-controls={panelId(baseId, value)}
      tabIndex={isSelected ? 0 : -1}
      onClick={() => onValueChange(value)}
      className={cn(
        "inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500",
        isSelected ? "bg-white text-brand-700 shadow-xs font-bold" : "text-slate-600 hover:text-slate-900",
        className
      )}
      {...props}
    />
  );
});
TabsTrigger.displayName = "TabsTrigger";

export const TabsContent = React.forwardRef(({ className, value, ...props }, ref) => {
  const { value: selectedValue, baseId } = useContext(TabsContext);
  if (selectedValue !== value) return null;

  return (
    <div
      ref={ref}
      role="tabpanel"
      id={panelId(baseId, value)}
      aria-labelledby={tabId(baseId, value)}
      tabIndex={0}
      className={cn("mt-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded-2xl", className)}
      {...props}
    />
  );
});
TabsContent.displayName = "TabsContent";
