"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { FixImpactCard } from "@/components/veil/FixImpactCard";
import { Wrench, Plus } from "lucide-react";
import { useFixes, useCreateFix } from "@/hooks/use-fixes";
import { toast } from "sonner";
import { FAILURE_CATEGORIES } from "@/lib/rules/categories";
import type { FailureCategory } from "@/lib/rules/categories";

export default function FixesPage() {
  const { data: fixes, isLoading } = useFixes();
  const createFix = useCreateFix();
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<string>("");

  function handleCreate() {
    if (!description.trim() || !category) {
      toast.error("Description and failure type are required");
      return;
    }
    createFix.mutate(
      { category, description },
      {
        onSuccess: () => {
          toast.success("Fix logged");
          setOpen(false);
          setDescription("");
          setCategory("");
        },
        onError: () => toast.error("Failed to log fix"),
      }
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Fix Tracking</h1>
          <p className="text-muted-foreground mt-1">
            Log fixes and see whether failure rates improved afterward.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5">
              <Plus className="h-4 w-4" />
              Log a fix
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Log a fix</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <Label>Failure type this fix addresses</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a failure type…" />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.entries(FAILURE_CATEGORIES) as [FailureCategory, string][]).map(
                      ([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>What did you fix?</Label>
                <Input
                  placeholder="e.g. Added pricing docs to knowledge base"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                />
              </div>
              <Button
                className="w-full"
                onClick={handleCreate}
                disabled={createFix.isPending}
              >
                {createFix.isPending ? "Logging…" : "Log fix"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <Card key={i}>
              <CardContent className="py-4">
                <Skeleton className="h-24 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : !fixes?.length ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Wrench className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium mb-2">No fixes logged yet</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              When you fix something — updating a prompt, adding docs, adjusting a tool —
              log it here. Veil will show you whether failure rates improved.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {fixes.map((fix) => (
            <FixImpactCard key={fix.id} fix={fix} />
          ))}
        </div>
      )}
    </div>
  );
}
