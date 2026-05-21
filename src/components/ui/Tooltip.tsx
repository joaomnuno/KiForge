import * as RadixTooltip from "@radix-ui/react-tooltip";
import type { ReactElement, ReactNode } from "react";
import "./Tooltip.css";

type TooltipSide = "top" | "right" | "bottom" | "left";

export interface TooltipProps {
  content: ReactNode;
  children: ReactElement;
  side?: TooltipSide;
}

/**
 * Tokenized wrapper around `@radix-ui/react-tooltip`.
 *
 * App code should import this file, NOT `@radix-ui/react-tooltip` directly.
 * The single import boundary keeps the Radix dependency swappable per
 * ADR 0001. See `docs/adr/0001-ui-primitives.md`.
 */
export function Tooltip({ content, children, side = "top" }: TooltipProps) {
  return (
    <RadixTooltip.Provider delayDuration={400}>
      <RadixTooltip.Root>
        <RadixTooltip.Trigger asChild>{children}</RadixTooltip.Trigger>
        <RadixTooltip.Portal>
          <RadixTooltip.Content
            className="tooltip__content"
            side={side}
            sideOffset={8}
          >
            {content}
            <RadixTooltip.Arrow className="tooltip__arrow" />
          </RadixTooltip.Content>
        </RadixTooltip.Portal>
      </RadixTooltip.Root>
    </RadixTooltip.Provider>
  );
}
