import type { ButtonHTMLAttributes } from "react";
import clsx from "clsx";
import "./Button.css";

type ButtonVariant = "primary" | "secondary" | "ghost";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

export function Button({
  className,
  variant = "primary",
  ...props
}: ButtonProps) {
  return (
    <button
      className={clsx("button", `button--${variant}`, className)}
      {...props}
    />
  );
}
