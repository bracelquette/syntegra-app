import { AppSidebar } from "~/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "~/components/ui/sidebar";
import { ReactNode } from "react";

const LayoutCandidate = ({ children }: { children: ReactNode }) => {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <div className="container mx-auto max-w-7xl px-4 py-6">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default LayoutCandidate;
