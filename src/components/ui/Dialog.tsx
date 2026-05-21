import * as RadixDialog from "@radix-ui/react-dialog";
import clsx from "clsx";
import type { ReactNode } from "react";
import { Button } from "./Button";

/**
 * Tokenized wrapper around `@radix-ui/react-dialog`.
 *
 * App code should import this file, NOT `@radix-ui/react-dialog` directly.
 * The single import boundary keeps the Radix dependency swappable per
 * ADR 0001. See `docs/adr/0001-ui-primitives.md`.
 */

export interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  /** Body content rendered between description and the action row. */
  children?: ReactNode;
  /** Action row rendered at the bottom of the dialog. */
  footer?: ReactNode;
}

export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer
}: DialogProps) {
  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="dialog__overlay" />
        <RadixDialog.Content
          className="dialog__content"
          aria-describedby={description ? undefined : ""}
        >
          <RadixDialog.Title className="dialog__title">
            {title}
          </RadixDialog.Title>
          {description ? (
            <RadixDialog.Description className="dialog__description">
              {description}
            </RadixDialog.Description>
          ) : null}
          {children ? <div className="dialog__body">{children}</div> : null}
          {footer ? <div className="dialog__footer">{footer}</div> : null}
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}

export interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  busy?: boolean;
  onConfirm: () => void | Promise<void>;
}

/**
 * Standard confirm-action dialog. Pairs a primary (or destructive) action
 * with a cancel. Used in place of `window.confirm` for any in-app prompt
 * that needs styling, focus management, or async behavior.
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive = false,
  busy = false,
  onConfirm
}: ConfirmDialogProps) {
  async function handleConfirm() {
    await onConfirm();
    onOpenChange(false);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      footer={
        <>
          <RadixDialog.Close asChild>
            <Button variant="secondary" type="button" disabled={busy}>
              {cancelLabel}
            </Button>
          </RadixDialog.Close>
          <Button
            variant="primary"
            type="button"
            onClick={() => void handleConfirm()}
            disabled={busy}
            className={clsx(destructive && "button--destructive")}
          >
            {busy ? "Working..." : confirmLabel}
          </Button>
        </>
      }
    />
  );
}
