import * as React from "react";

export interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {}

const Tabs = React.forwardRef<HTMLDivElement, TabsProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={`w-full ${className || ""}`}
      {...props}
    />
  )
);
Tabs.displayName = "Tabs";

export interface TabsListProps extends React.HTMLAttributes<HTMLDivElement> {}

const TabsList = React.forwardRef<HTMLDivElement, TabsListProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={`inline-flex h-10 items-center justify-center rounded-md bg-gray-100 p-1 ${
        className || ""
      }`}
      role="tablist"
      {...props}
    />
  )
);
TabsList.displayName = "TabsList";

export interface TabsTriggerProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
}

const TabsTrigger = React.forwardRef<HTMLButtonElement, TabsTriggerProps>(
  ({ className, value, ...props }, ref) => {
    const context = React.useContext(TabsContext);
    const isActive = context?.value === value;

    return (
      <button
        ref={ref}
        role="tab"
        aria-selected={isActive}
        data-state={isActive ? "active" : "inactive"}
        data-value={value}
        className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${
          isActive
            ? "bg-white text-gray-900 shadow-sm"
            : "text-gray-600 hover:text-gray-900"
        } ${className || ""}`}
        onClick={() => context?.onValueChange?.(value)}
        {...props}
      />
    );
  }
);
TabsTrigger.displayName = "TabsTrigger";

export interface TabsContentProps
  extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
}

const TabsContent = React.forwardRef<HTMLDivElement, TabsContentProps>(
  ({ className, value, ...props }, ref) => {
    const context = React.useContext(TabsContext);
    const isActive = context?.value === value;

    if (!isActive) return null;

    return (
      <div
        ref={ref}
        role="tabpanel"
        data-state={isActive ? "active" : "inactive"}
        data-value={value}
        className={`mt-2 ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2 ${
          className || ""
        }`}
        {...props}
      />
    );
  }
);
TabsContent.displayName = "TabsContent";

// Create a context for the tabs component
interface TabsContextValue {
  value: string;
  onValueChange?: (value: string) => void;
}

const TabsContext = React.createContext<TabsContextValue | undefined>(undefined);

export interface RootTabsProps extends TabsProps {
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
}

const RootTabs = React.forwardRef<HTMLDivElement, RootTabsProps>(
  ({ defaultValue, value, onValueChange, ...props }, ref) => {
    const [tabValue, setTabValue] = React.useState(value || defaultValue || "");

    React.useEffect(() => {
      if (value !== undefined) {
        setTabValue(value);
      }
    }, [value]);

    const handleValueChange = React.useCallback(
      (newValue: string) => {
        setTabValue(newValue);
        onValueChange?.(newValue);
      },
      [onValueChange]
    );

    return (
      <TabsContext.Provider
        value={{ value: tabValue, onValueChange: handleValueChange }}
      >
        <Tabs ref={ref} {...props} />
      </TabsContext.Provider>
    );
  }
);
RootTabs.displayName = "RootTabs";

export { RootTabs as Tabs, TabsList, TabsTrigger, TabsContent };
