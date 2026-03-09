import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FolderOpen, Plus, Check } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface Props {
  tripId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddToCollectionModal({ tripId, open, onOpenChange }: Props) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [newName, setNewName] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  const { data: collections } = useQuery({
    queryKey: ["collections", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("collections")
        .select("*, collection_items(trip_id)")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!user && open,
  });

  const addToCollection = useMutation({
    mutationFn: async (collectionId: string) => {
      const { error } = await supabase.from("collection_items").insert({
        collection_id: collectionId,
        trip_id: tripId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collections"] });
      toast.success("Added to collection!");
      onOpenChange(false);
    },
    onError: (e: any) => {
      if (e.message?.includes("duplicate")) {
        toast.info("Already in this collection");
      } else {
        toast.error("Failed to add to collection");
      }
    },
  });

  const createAndAdd = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .from("collections")
        .insert({ user_id: user!.id, name: newName.trim() })
        .select()
        .single();
      if (error) throw error;
      const { error: err2 } = await supabase
        .from("collection_items")
        .insert({ collection_id: data.id, trip_id: tripId });
      if (err2) throw err2;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collections"] });
      toast.success("Collection created & trip added!");
      setNewName("");
      setShowCreate(false);
      onOpenChange(false);
    },
    onError: () => toast.error("Failed to create collection"),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Add to Collection</DialogTitle>
        </DialogHeader>
        <div className="space-y-2 max-h-[300px] overflow-y-auto">
          {collections?.map((col: any) => {
            const alreadyAdded = col.collection_items?.some((i: any) => i.trip_id === tripId);
            return (
              <button
                key={col.id}
                disabled={alreadyAdded || addToCollection.isPending}
                onClick={() => addToCollection.mutate(col.id)}
                className="flex items-center gap-3 w-full rounded-lg px-3 py-2.5 text-left text-sm hover:bg-muted transition-colors disabled:opacity-50"
              >
                <FolderOpen className="h-4 w-4 text-accent shrink-0" />
                <span className="flex-1 truncate">{col.name}</span>
                {alreadyAdded && <Check className="h-4 w-4 text-accent" />}
              </button>
            );
          })}
          {(!collections || collections.length === 0) && !showCreate && (
            <p className="text-sm text-muted-foreground text-center py-4">No collections yet</p>
          )}
        </div>
        {showCreate ? (
          <div className="flex gap-2 pt-2">
            <Input
              placeholder="Collection name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="flex-1"
            />
            <Button
              size="sm"
              className="bg-accent text-accent-foreground hover:bg-accent/90"
              disabled={!newName.trim() || createAndAdd.isPending}
              onClick={() => createAndAdd.mutate()}
            >
              Add
            </Button>
          </div>
        ) : (
          <Button variant="outline" size="sm" className="w-full" onClick={() => setShowCreate(true)}>
            <Plus className="mr-2 h-3.5 w-3.5" /> New Collection
          </Button>
        )}
      </DialogContent>
    </Dialog>
  );
}