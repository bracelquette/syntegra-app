import { AppSidebarAdmin } from "~/components/app-sidebar-admin";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "~/components/ui/breadcrumb";
import { Separator } from "~/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "~/components/ui/sidebar";
import { Link, useLocation } from "@tanstack/react-router";
import { ReactNode } from "react";

// Mapping untuk breadcrumb
const breadcrumbMap: Record<string, { title: string; href?: string }> = {
  "/dashboard": { title: "Dashboard" },
  "/participants": { title: "Manajemen Peserta" },
  "/reports": { title: "Laporan & Hasil" },
  "/modules": { title: "Modul Psikotes" },
  "/sessions": { title: "Sesi & Waktu" },
  "/settings": { title: "Pengaturan Sistem" },
};

const LayoutDashboard = ({ children }: { children: ReactNode }) => {
  const location = useLocation();
  const pathname = location.pathname;

  // Handle dynamic routes
  const getBreadcrumb = () => {
    if (pathname.startsWith("/participants/") && pathname !== "/participants") {
      // This is a participant detail page
      return {
        parent: { title: "Manajemen Peserta", href: "/participants" },
        current: { title: "Detail Peserta" },
      };
    }

    if (pathname.startsWith("/reports/") && pathname !== "/reports") {
      // This is a report detail page
      return {
        parent: { title: "Laporan & Hasil", href: "/reports" },
        current: { title: "Detail Laporan" },
      };
    }

    if (pathname.startsWith("/modules/") && pathname !== "/modules") {
      // This is a module detail page
      return {
        parent: { title: "Modul Psikotes", href: "/modules" },
        current: { title: "Detail Modul" },
      };
    }

    if (pathname.startsWith("/sessions/") && pathname !== "/sessions") {
      // This is a session detail page
      return {
        parent: { title: "Sesi & Waktu", href: "/sessions" },
        current: { title: "Detail Sesi" },
      };
    }

    if (pathname.startsWith("/settings/") && pathname !== "/settings") {
      // This is a settings detail page
      return {
        parent: { title: "Pengaturan Sistem", href: "/settings" },
        current: { title: "Detail Pengaturan" },
      };
    }

    return {
      current: breadcrumbMap[pathname],
    };
  };

  const breadcrumb = getBreadcrumb();

  return (
    <SidebarProvider>
      <AppSidebarAdmin />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink asChild>
                    <Link to="/">Sistem Psikotes</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                {breadcrumb.parent && (
                  <>
                    <BreadcrumbSeparator className="hidden md:block" />
                    <BreadcrumbItem className="hidden md:block">
                      <BreadcrumbLink asChild>
                        <Link to={breadcrumb.parent.href as any}>
                          {breadcrumb.parent.title}
                        </Link>
                      </BreadcrumbLink>
                    </BreadcrumbItem>
                  </>
                )}
                {breadcrumb.current && (
                  <>
                    <BreadcrumbSeparator className="hidden md:block" />
                    <BreadcrumbItem>
                      <BreadcrumbPage>
                        {breadcrumb.current.title}
                      </BreadcrumbPage>
                    </BreadcrumbItem>
                  </>
                )}
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="container mx-auto max-w-7xl px-4 py-6">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default LayoutDashboard;
