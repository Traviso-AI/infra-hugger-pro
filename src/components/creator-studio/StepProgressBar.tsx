import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const steps = [
  { number: 1, label: "Trip Basics" },
  { number: 2, label: "Build Itinerary" },
  { number: 3, label: "Preview & Publish" },
];

interface StepProgressBarProps {
  currentStep: number;
}

export function StepProgressBar({ currentStep }: StepProgressBarProps) {
  return (
    <div className="flex items-center justify-center gap-0 w-full max-w-lg mx-auto">
      {steps.map((step, idx) => (
        <div key={step.number} className="flex items-center flex-1 last:flex-none">
          <div className="flex flex-col items-center gap-1.5">
            <div
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-full border-2 text-sm font-semibold transition-all",
                currentStep > step.number
                  ? "border-accent bg-accent text-accent-foreground"
                  : currentStep === step.number
                  ? "border-accent bg-accent/10 text-accent"
                  : "border-muted-foreground/30 text-muted-foreground/50"
              )}
            >
              {currentStep > step.number ? <Check className="h-4 w-4" /> : step.number}
            </div>
            <span
              className={cn(
                "text-xs font-medium whitespace-nowrap",
                currentStep >= step.number ? "text-foreground" : "text-muted-foreground/50"
              )}
            >
              {step.label}
            </span>
          </div>
          {idx < steps.length - 1 && (
            <div
              className={cn(
                "h-0.5 flex-1 mx-3 mt-[-1.25rem] rounded-full transition-all",
                currentStep > step.number ? "bg-accent" : "bg-muted-foreground/20"
              )}
            />
          )}
        </div>
      ))}
    </div>
  );
}
