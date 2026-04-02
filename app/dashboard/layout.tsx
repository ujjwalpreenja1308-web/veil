import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/veil/AppSidebar";
import { ErrorBoundary } from "@/components/veil/ErrorBoundary";
import { RealtimeProvider } from "@/components/veil/RealtimeProvider";

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
          <RealtimeProvider />
          <div className="p-6">
            <ErrorBoundary>{children}</ErrorBoundary>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
