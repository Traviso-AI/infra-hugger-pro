import { cn } from "@/lib/utils";
import { BadgeCheck, Crown } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface VerifiedBadgeProps {
  isVerified?: boolean;
  isTopCreator?: boolean;
  className?: string;
}

export function VerifiedBadge({ isVerified, isTopCreator, className }: VerifiedBadgeProps) {
  if (!isVerified && !isTopCreator) return null;

  return (
    <span className={cn("inline-flex items-center gap-1", className)}>
      {isTopCreator && (
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-sunset/10">
              <Crown className="h-3.5 w-3.5 text-sunset" />
            </span>
          </TooltipTrigger>
          <TooltipContent>Top Creator</TooltipContent>
        </Tooltip>
      )}
      {isVerified && (
        <Tooltip>
          <TooltipTrigger asChild>
            <BadgeCheck className="h-5 w-5 text-accent fill-accent/20" />
          </TooltipTrigger>
          <TooltipContent>Verified Creator</TooltipContent>
        </Tooltip>
      )}
    </span>
  );
}
