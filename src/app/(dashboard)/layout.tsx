"use client";

import { Dock, TopBar, StatusBar } from "@/components/SuperBotijo";
import { FleetSidebar } from "@/components/FleetSidebar";
import { useFleetSidebar } from "@/hooks/useFleetSidebar";
import { I18nProvider } from "@/i18n/provider";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isOpen: fleetSidebarOpen, toggleSidebar } = useFleetSidebar();

  return (
    <I18nProvider>
      <div className="superbotijo-shell" style={{ minHeight: "100vh" }}>
        <Dock />
        <TopBar />
        
        <main
          style={{
            marginLeft: "68px", // Width of dock
            marginTop: "48px", // Height of top bar
            marginBottom: "32px", // Height of status bar
            minHeight: "calc(100vh - 48px - 32px)",
            padding: "24px",
            marginRight: fleetSidebarOpen ? "320px" : "0",
            transition: "margin-right 0.3s ease",
          }}
        >
          {children}
        </main>

        <StatusBar />
        
        <FleetSidebar 
          isOpen={fleetSidebarOpen} 
          onToggle={toggleSidebar} 
        />
      </div>
    </I18nProvider>
  );
}
