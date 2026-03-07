import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { History, Plus, Trash2, MessageSquare } from "lucide-react";
import { Conversation } from "@/hooks/useConversations";
import { formatDistanceToNow } from "date-fns";

interface Props {
  conversations: Conversation[];
  activeId: string;
  loading: boolean;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ChatHistoryDrawer({
  conversations,
  activeId,
  loading,
  onSelect,
  onNew,
  onDelete,
  open,
  onOpenChange,
}: Props) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="shrink-0 h-9 w-9" title="Chat history">
          <History className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 p-0 flex flex-col">
        <SheetHeader className="p-4 pb-2 border-b">
          <SheetTitle className="text-base">Chat History</SheetTitle>
        </SheetHeader>

        <div className="p-3">
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start gap-2"
            onClick={() => {
              onNew();
              onOpenChange(false);
            }}
          >
            <Plus className="h-3.5 w-3.5" /> New Chat
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-1">
          {loading && (
            <p className="text-xs text-muted-foreground text-center py-8">Loading…</p>
          )}
          {!loading && conversations.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-8">No conversations yet</p>
          )}
          {conversations.map((c) => (
            <button
              key={c.id}
              onClick={() => {
                onSelect(c.id);
                onOpenChange(false);
              }}
              className={`w-full text-left rounded-lg px-3 py-2.5 group transition-colors flex items-start gap-2 ${
                c.id === activeId
                  ? "bg-accent/10 text-foreground"
                  : "hover:bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              <MessageSquare className="h-3.5 w-3.5 mt-0.5 shrink-0 opacity-60" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{c.title}</p>
                <p className="text-[10px] opacity-60">
                  {formatDistanceToNow(new Date(c.updated_at), { addSuffix: true })}
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(c.id);
                }}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:text-destructive shrink-0"
                title="Delete chat"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </button>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
