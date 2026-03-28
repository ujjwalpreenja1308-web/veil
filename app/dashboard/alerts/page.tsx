"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCard } from "@/components/veil/AlertCard";
import { Bell } from "lucide-react";
import { useClassifications } from "@/hooks/use-classifications";

export default function AlertsPage() {
  const { data: classifications, isLoading } = useClassifications();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Alerts</h1>
        <p className="text-muted-foreground mt-1">All detected failures across your agents.</p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="py-4">
                <Skeleton className="h-12 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : !classifications?.length ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Bell className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium mb-2">No alerts</h3>
            <p className="text-sm text-muted-foreground">
              Failure classifications will appear here when your agents encounter issues.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {classifications.map((c) => (
            <AlertCard key={c.id} classification={c} />
          ))}
        </div>
      )}
    </div>
  );
}
