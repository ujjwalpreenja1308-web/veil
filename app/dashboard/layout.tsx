import { Suspense } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/veil/AppSidebar";
import { ErrorBoundary } from "@/components/veil/ErrorBoundary";
import { RealtimeProvider } from "@/components/veil/RealtimeProvider";

function DashboardSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-8 w-48 rounded bg-muted" />
      <div className="h-32 rounded bg-muted" />
      <div className="h-32 rounded bg-muted" />
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <main className="flex-1 overflow-auto">
          <div className="flex items-center gap-2 border-b border-border px-6 py-3 md:hidden">
            <SidebarTrigger />
            <span className="text-sm font-semibold text-primary">Veil</span>
          </div>
          <div className="p-6">
            <ErrorBoundary>
              <RealtimeProvider />
              <Suspense fallback={<DashboardSkeleton />}>{children}</Suspense>
            </ErrorBoundary>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
