import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Loader2, Save } from "lucide-react";

interface StickyBottomBarProps {
  currentStep: number;
  onBack: () => void;
  onNext: () => void;
  onSaveDraft: () => void;
  onPublish: () => void;
  loading: boolean;
}

export function StickyBottomBar({ currentStep, onBack, onNext, onSaveDraft, onPublish, loading }: StickyBottomBarProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t bg-background/95 backdrop-blur-sm">
      <div className="container max-w-3xl flex items-center justify-between py-3 gap-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <div className="flex gap-1">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-1.5 w-6 rounded-full transition-all ${
                  s <= currentStep ? "bg-accent" : "bg-muted-foreground/20"
                }`}
              />
            ))}
          </div>
          <span>Step {currentStep} of 3</span>
        </div>

        <div className="flex items-center gap-2">
          {currentStep > 1 && (
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="mr-1 h-4 w-4" /> Back
            </Button>
          )}

          {currentStep < 3 && (
            <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90" onClick={onNext}>
              Next <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          )}

          {currentStep === 3 && (
            <>
              <Button variant="outline" size="sm" onClick={onSaveDraft} disabled={loading}>
                <Save className="mr-1 h-4 w-4" /> Save Draft
              </Button>
              <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90" onClick={onPublish} disabled={loading}>
                {loading ? <><Loader2 className="mr-1 h-4 w-4 animate-spin" /> Publishing...</> : "Publish Trip"}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
