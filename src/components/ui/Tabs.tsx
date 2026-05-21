import * as RadixTabs from "@radix-ui/react-tabs";
import clsx from "clsx";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ComponentPropsWithoutRef
} from "react";
import "./Tabs.css";

/**
 * Tokenized wrapper around `@radix-ui/react-tabs`.
 *
 * App code should import this file, NOT `@radix-ui/react-tabs` directly.
 * Radix owns roving tabindex and ARIA wiring; this wrapper owns KiForge
 * class names and token styling.
 */

type TabsProps = ComponentPropsWithoutRef<typeof RadixTabs.Root>;
type TabsListProps = ComponentPropsWithoutRef<typeof RadixTabs.List>;
type TabsTriggerProps = ComponentPropsWithoutRef<typeof RadixTabs.Trigger>;
type TabsPanelProps = ComponentPropsWithoutRef<typeof RadixTabs.Content>;

const TabsValueContext = createContext<string | undefined>(undefined);

export function Tabs({
  className,
  value,
  defaultValue,
  onValueChange,
  ...props
}: TabsProps) {
  const [currentValue, setCurrentValue] = useState(value ?? defaultValue);

  useEffect(() => {
    if (value !== undefined) {
      setCurrentValue(value);
    }
  }, [value]);

  function handleValueChange(nextValue: string) {
    if (value === undefined) {
      setCurrentValue(nextValue);
    }
    onValueChange?.(nextValue);
  }

  return (
    <TabsValueContext.Provider value={currentValue}>
      <RadixTabs.Root
        className={clsx("tabs", className)}
        value={value}
        defaultValue={defaultValue}
        onValueChange={handleValueChange}
        {...props}
      />
    </TabsValueContext.Provider>
  );
}

export function TabsList({ className, ...props }: TabsListProps) {
  return (
    <RadixTabs.List className={clsx("tabs__list", className)} {...props} />
  );
}

export function TabsTrigger({ className, value, ...props }: TabsTriggerProps) {
  const currentValue = useContext(TabsValueContext);

  return (
    <RadixTabs.Trigger
      className={clsx(
        "tabs__trigger",
        currentValue === value && "tabs__trigger--active",
        className
      )}
      value={value}
      {...props}
    />
  );
}

export function TabsPanel({ className, ...props }: TabsPanelProps) {
  return (
    <RadixTabs.Content className={clsx("tabs__panel", className)} {...props} />
  );
}
