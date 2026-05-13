import Sidebar from "@/components/layout/Sidebar";
import AuthGuard from "@/components/auth/AuthGuard";
import { SocketProvider } from "@/providers/SocketProvider";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AuthGuard>
      <SocketProvider>
        <div className="min-h-screen flex bg-gray-950">
          <Sidebar />
          <main className="flex-1">
            {children}
          </main>
        </div>
      </SocketProvider>
    </AuthGuard>
  );
}
