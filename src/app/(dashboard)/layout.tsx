import DashboardShell from "@/components/shared/DashboardShell";
import { UIProvider } from "@/hooks/useUI";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <UIProvider>
      <DashboardShell>
        {children}
      </DashboardShell>
    </UIProvider>
  );
}
