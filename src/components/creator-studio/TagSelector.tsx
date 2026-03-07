import { cn } from "@/lib/utils";

const PRESET_TAGS = [
  "beach", "nightlife", "culture", "food", "luxury", "adventure",
  "wellness", "friends", "couples", "solo", "budget", "nature",
];

interface TagSelectorProps {
  selected: string[];
  onChange: (tags: string[]) => void;
}

export function TagSelector({ selected, onChange }: TagSelectorProps) {
  const toggle = (tag: string) => {
    onChange(
      selected.includes(tag)
        ? selected.filter((t) => t !== tag)
        : [...selected, tag]
    );
  };

  return (
    <div className="flex flex-wrap gap-2">
      {PRESET_TAGS.map((tag) => (
        <button
          key={tag}
          type="button"
          onClick={() => toggle(tag)}
          className={cn(
            "rounded-full px-3.5 py-1.5 text-sm font-medium border transition-all",
            selected.includes(tag)
              ? "bg-accent text-accent-foreground border-accent"
              : "bg-secondary text-secondary-foreground border-transparent hover:border-accent/40"
          )}
        >
          {tag}
        </button>
      ))}
    </div>
  );
}
