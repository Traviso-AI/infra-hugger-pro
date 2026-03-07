import nalaAvatar from "@/assets/nala-avatar.png";

export function NalaAvatar({ size = "sm", showOnline = false }: { size?: "sm" | "lg"; showOnline?: boolean }) {
  const sizeClasses = size === "lg" ? "h-16 w-16" : "h-7 w-7";
  return (
    <div className="relative shrink-0">
      <div className={`${sizeClasses} rounded-full bg-accent/10 border-2 border-accent/20 overflow-hidden flex items-center justify-center`}>
        <img src={nalaAvatar} alt="Nala" className="h-full w-full object-cover" />
      </div>
      {showOnline && (
        <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
          <span className="relative inline-flex rounded-full h-4 w-4 bg-accent border-2 border-background" />
        </span>
      )}
    </div>
  );
}
