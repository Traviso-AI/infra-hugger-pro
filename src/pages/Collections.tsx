import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, FolderOpen, Trash2, MapPin } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { TripCard } from "@/components/trips/TripCard";

export default function Collections() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null);

  const { data: collections } = useQuery({
    queryKey: ["collections", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("collections")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!user,
  });

  const { data: collectionItems } = useQuery({
    queryKey: ["collection-items", selectedCollection],
    queryFn: async () => {
      const { data } = await supabase
        .from("collection_items")
        .select("*, trips(*, profiles!trips_creator_id_profiles_fkey(display_name, avatar_url))")
        .eq("collection_id", selectedCollection!)
        .order("added_at", { ascending: false });
      return data || [];
    },
    enabled: !!selectedCollection,
  });

  const createCollection = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("collections").insert({
        user_id: user!.id,
        name: newName.trim(),
        description: newDesc.trim() || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collections"] });
      setNewName("");
      setNewDesc("");
      setDialogOpen(false);
      toast.success("Collection created!");
    },
    onError: () => toast.error("Failed to create collection"),
  });

  const deleteCollection = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("collections").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collections"] });
      if (selectedCollection) setSelectedCollection(null);
      toast.success("Collection deleted");
    },
  });

  const removeItem = useMutation({
    mutationFn: async (itemId: string) => {
      const { error } = await supabase.from("collection_items").delete().eq("id", itemId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collection-items"] });
      toast.success("Trip removed from collection");
    },
  });

  const selected = collections?.find((c) => c.id === selectedCollection);

  return (
    <div className="container px-4 py-6 md:py-12">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6 md:mb-8">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold">My Collections</h1>
          <p className="text-muted-foreground text-sm">Organize your saved trips into themed collections</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-accent text-accent-foreground hover:bg-accent/90 w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" /> New Collection
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Collection</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <Input
                placeholder="e.g. Summer 2026, Honeymoon Ideas"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
              <Textarea
                placeholder="Description (optional)"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                rows={3}
              />
              <Button
                className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
                disabled={!newName.trim() || createCollection.isPending}
                onClick={() => createCollection.mutate()}
              >
                {createCollection.isPending ? "Creating..." : "Create Collection"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {selectedCollection && selected ? (
        <div>
          <Button variant="ghost" className="mb-4" onClick={() => setSelectedCollection(null)}>
            ← Back to Collections
          </Button>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-display text-xl font-bold">{selected.name}</h2>
              {selected.description && (
                <p className="text-sm text-muted-foreground">{selected.description}</p>
              )}
            </div>
            <span className="text-sm text-muted-foreground">{collectionItems?.length || 0} trips</span>
          </div>
          {collectionItems && collectionItems.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {collectionItems.map((item: any) => {
                const trip = item.trips;
                if (!trip) return null;
                return (
                  <div key={item.id} className="relative group">
                    <TripCard
                      id={trip.id}
                      title={trip.title}
                      destination={trip.destination}
                      coverImage={trip.cover_image_url}
                      durationDays={trip.duration_days}
                      priceEstimate={trip.price_estimate}
                      avgRating={trip.avg_rating}
                      totalBookings={trip.total_bookings}
                      creatorName={trip.profiles?.display_name}
                      creatorAvatar={trip.profiles?.avatar_url}
                      tags={trip.tags}
                    />
                    <Button
                      size="sm"
                      variant="destructive"
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0"
                      onClick={(e) => { e.preventDefault(); removeItem.mutate(item.id); }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState
              icon={MapPin}
              title="Collection is empty"
              description="Add trips from the Explore page to start building this collection."
              actionLabel="Explore Trips"
              actionHref="/explore"
            />
          )}
        </div>
      ) : (
        <>
          {collections && collections.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {collections.map((col) => (
                <Card
                  key={col.id}
                  className="cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] hover:border-l-4 hover:border-l-accent"
                  onClick={() => setSelectedCollection(col.id)}
                >
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
                          <FolderOpen className="h-5 w-5 text-accent" />
                        </div>
                        <div>
                          <h3 className="font-medium">{col.name}</h3>
                          {col.description && (
                            <p className="text-xs text-muted-foreground line-clamp-1">{col.description}</p>
                          )}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                        onClick={(e) => { e.stopPropagation(); deleteCollection.mutate(col.id); }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={FolderOpen}
              title="No collections yet"
              description="Organize your saved trips into themed collections like 'Summer 2026' or 'Honeymoon Ideas'."
              actionLabel="Create Your First Collection"
              onAction={() => setDialogOpen(true)}
              secondaryLabel="Explore Trips"
              secondaryHref="/explore"
            />
          )}
        </>
      )}
    </div>
  );
}