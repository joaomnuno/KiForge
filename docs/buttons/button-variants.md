# Button variants

Source: [src/components/ui/Button.tsx](../../src/components/ui/Button.tsx)

The `<Button>` component wraps a semantic `<button>` element and accepts the
`variant` prop. All standard `ButtonHTMLAttributes` are forwarded.

## Primary

- **Class**: `button button--primary`
- **Use for**: the dominant action on a screen or panel — submit a form,
  advance to the next step, create something new.
- **Examples**: "Create project", "Save connection", "New connection",
  "Use template".
- **Styling**: gradient `--primary` → `--primary-strong` background.

## Secondary

- **Class**: `button button--secondary`
- **Use for**: a parallel action sitting next to primary, or a strong action
  that should not steal focus from the page hero.
- **Examples**: "Open" (project card), "Add" (library card),
  "Auto-assign suggestions", "Show all projects".
- **Styling**: muted background with a faint cyan outline.

## Ghost

- **Class**: `button button--ghost`
- **Use for**: tertiary, mostly destructive or auxiliary actions.
- **Examples**: "Cancel", "Delete", "Duplicate", "Rename", "Export",
  "Reset", "Remove", "Reset to defaults".
- **Styling**: transparent background, muted text.

## Behavior shared across variants

- Hover: brightness lifts ~4%.
- Active: translates down by 1px.
- Disabled: opacity drops; pointer becomes default.
- All three are real `<button>` elements, so `type="button"` should be set
  explicitly when the button is inside a `<form>` and should not submit it.
