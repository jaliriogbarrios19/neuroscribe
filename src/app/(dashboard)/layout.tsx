import DashboardShell from '@/components/shared/DashboardShell';
import { UIProvider } from '@/hooks/useUI';
import { ModelProvider } from '@/hooks/useModels';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <UIProvider>
      <ModelProvider>
        <DashboardShell>{children}</DashboardShell>
      </ModelProvider>
    </UIProvider>
  );
}
