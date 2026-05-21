import * as RadixDropdownMenu from "@radix-ui/react-dropdown-menu";
import clsx from "clsx";
import type { ComponentPropsWithoutRef, ReactElement, ReactNode } from "react";
import "./DropdownMenu.css";

type DropdownMenuContentProps = ComponentPropsWithoutRef<
  typeof RadixDropdownMenu.Content
>;
type DropdownMenuRootProps = ComponentPropsWithoutRef<
  typeof RadixDropdownMenu.Root
>;

/**
 * Tokenized wrapper around `@radix-ui/react-dropdown-menu`.
 *
 * App code should import this file, NOT `@radix-ui/react-dropdown-menu`
 * directly. The single import boundary keeps the Radix dependency swappable
 * per ADR 0001. See `docs/adr/0001-ui-primitives.md`.
 */
export interface DropdownMenuProps extends Omit<
  DropdownMenuRootProps,
  "children"
> {
  trigger: ReactElement;
  children: ReactNode;
  align?: DropdownMenuContentProps["align"];
  sideOffset?: DropdownMenuContentProps["sideOffset"];
  contentClassName?: string;
}

export function DropdownMenu({
  trigger,
  children,
  align = "end",
  sideOffset = 8,
  contentClassName,
  ...props
}: DropdownMenuProps) {
  return (
    <RadixDropdownMenu.Root {...props}>
      <RadixDropdownMenu.Trigger asChild>{trigger}</RadixDropdownMenu.Trigger>
      <RadixDropdownMenu.Portal>
        <RadixDropdownMenu.Content
          align={align}
          className={clsx("dropdown-menu__content", contentClassName)}
          sideOffset={sideOffset}
        >
          {children}
        </RadixDropdownMenu.Content>
      </RadixDropdownMenu.Portal>
    </RadixDropdownMenu.Root>
  );
}

export interface DropdownMenuItemProps extends ComponentPropsWithoutRef<
  typeof RadixDropdownMenu.Item
> {
  destructive?: boolean;
}

export function DropdownMenuItem({
  className,
  destructive = false,
  ...props
}: DropdownMenuItemProps) {
  return (
    <RadixDropdownMenu.Item
      className={clsx(
        "dropdown-menu__item",
        destructive && "dropdown-menu__item--destructive",
        className
      )}
      {...props}
    />
  );
}

export function DropdownMenuSeparator({
  className,
  ...props
}: ComponentPropsWithoutRef<typeof RadixDropdownMenu.Separator>) {
  return (
    <RadixDropdownMenu.Separator
      className={clsx("dropdown-menu__separator", className)}
      {...props}
    />
  );
}

export function DropdownMenuLabel({
  className,
  ...props
}: ComponentPropsWithoutRef<typeof RadixDropdownMenu.Label>) {
  return (
    <RadixDropdownMenu.Label
      className={clsx("dropdown-menu__label", className)}
      {...props}
    />
  );
}
