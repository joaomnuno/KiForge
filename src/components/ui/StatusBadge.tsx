import clsx from "clsx";
interface StatusBadgeProps {
  label: string;
}

function getTone(label: StatusBadgeProps["label"]) {
  if (
    label === "Ready to Generate" ||
    label === "Generated" ||
    label === "Valid" ||
    label === "Connected"
  ) {
    return "success";
  }

  if (
    label === "Has Conflicts" ||
    label === "Needs work" ||
    label === "Unconnected"
  ) {
    return "error";
  }

  return "warning";
}

export function StatusBadge({ label }: StatusBadgeProps) {
  return (
    <span className={clsx("status-badge", `status-badge--${getTone(label)}`)}>
      <span className="status-badge__dot" />
      {label}
    </span>
  );
}
