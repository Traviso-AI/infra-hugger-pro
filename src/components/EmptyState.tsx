import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  secondaryLabel?: string;
  secondaryHref?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  secondaryLabel,
  secondaryHref,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed bg-muted/30 px-6 py-14 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/10 mb-4">
        <Icon className="h-7 w-7 text-accent" />
      </div>
      <h3 className="font-display text-lg font-semibold mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-5">{description}</p>
      <div className="flex flex-wrap items-center gap-3">
        {actionLabel && actionHref && (
          <Button asChild className="bg-accent text-accent-foreground hover:bg-accent/90">
            <Link to={actionHref}>{actionLabel}</Link>
          </Button>
        )}
        {actionLabel && onAction && !actionHref && (
          <Button className="bg-accent text-accent-foreground hover:bg-accent/90" onClick={onAction}>
            {actionLabel}
          </Button>
        )}
        {secondaryLabel && secondaryHref && (
          <Button asChild variant="outline">
            <Link to={secondaryHref}>{secondaryLabel}</Link>
          </Button>
        )}
      </div>
    </div>
  );
}
