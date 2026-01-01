import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { DashboardHome } from "./DashboardHome";
import { LedgerList } from "./LedgerList";
import { LedgerDetailView } from "./LedgerDetailView";
import { VoucherExplorer } from "./VoucherExplorer";
import { OrderBook } from "./OrderBook";
import { MonthlySummary } from "./MonthlySummary";
import { InventoryPage } from "./InventoryPage";
import { SettingsPage } from "./SettingsPage";
import { AdminDashboard } from "./admin/AdminDashboard";

import { API_URL } from "../config/api";



export type PageType =
  | "dashboard"
  | "admin"
  | "ledgers"
  | "ledger-detail"
  | "vouchers"
  | "orders"
  | "monthly-summary"
  | "inventory"
  | "settings";

export function DashboardLayout({
  user: initialUser,
  onLogout,
}: {
  user: {
  id: number;
  username: string;
  role: "ADMIN" | "USER";

  ledgerPermissions?: {
    columns: Record<string, boolean>;
  };

  vouchersPermissions?: {
    columns: Record<string, boolean>;
  };

  ordersPermissions?: {
    can_view?: boolean;
    columns?: Record<string, boolean>;
  };

  inventoryPermissions?: {
    can_view?: boolean;
    columns?: Record<string, boolean>;
  };
  
  dashboardPermissions?: {
    widgets: Record<string, boolean>;
  };
};

  onLogout: () => void;
}) {


const [user, setUser] = useState(initialUser);

  const [currentPage, setCurrentPage] = useState<PageType>("dashboard");
  const [selectedLedgerId, setSelectedLedgerId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
const refreshCurrentUser = async () => {
  try {
    // DashboardLayout.tsx
const res = await fetch(`${API_URL}/users/me`, {
  headers: {
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  },
});


    const updatedUser = await res.json();
    setUser(updatedUser);
  } catch (err) {
    console.error("Failed to refresh user", err);
  }
};



console.log("DASHBOARD USER:", user);
const isAdmin = user.role === "ADMIN";

const canAccess = (page: PageType) => {
  if (isAdmin) return true;

  switch (page) {
  case "dashboard":
  return true;

    case "ledgers":
      return true; // handled inside LedgerList

    case "vouchers":
      return true; // handled inside VoucherExplorer

    case "orders":
      return user.ordersPermissions?.can_view !== false;

    case "inventory":
      return user.inventoryPermissions?.can_view !== false;

    case "monthly-summary":
      return false; // USER should NOT access this

    case "settings":
      return true;

    default:
      return false;
  }
};

  /* ================================
     MODULE-LEVEL PERMISSIONS
     ================================ */
  const modulePermissions: Partial<Record<PageType, boolean>> = {
    dashboard: true,
    ledgers: true,
    vouchers: true,
    orders: true,
"monthly-summary": isAdmin,
    inventory: true,
    settings: true,
  };

  const NoPermission = () => (
  <div className="p-10 text-center text-gray-500">
    <h2 className="text-xl font-semibold mb-2">
      Access Denied
    </h2>
    <p>
      You don’t have permission to view this page.
      Please contact the administrator.
    </p>
  </div>
);

  /* ================================
     PAGE RENDERER
     ================================ */
 const renderPage = () => {
  if (!canAccess(currentPage)) {
    return <NoPermission />;
  }

  switch (currentPage) {

      case "admin":
        return (
        <AdminDashboard
  role={user.role}
  ledgerPermissions={null}
  onLedgerPermissionsChange={() => {}}
  refreshCurrentUser={refreshCurrentUser}
/>



          
        );

      case "dashboard":
  return (
    <DashboardHome
      onNavigate={setCurrentPage}
      user={user}
    />
  );


      case "ledgers":
  return (
    <LedgerList
      onViewLedger={(id) => {
        setSelectedLedgerId(id);
        setCurrentPage("ledger-detail");
      }}
      user={user}   // ✅ THIS FIXES THE CRASH
    />
  );


      case "ledger-detail":
        if (!selectedLedgerId) return null;
        return (
          <LedgerDetailView
            ledgerId={selectedLedgerId}
            onBack={() => setCurrentPage("ledgers")}
          />
        );

    case "vouchers":
  return <VoucherExplorer user={user} />;

      case "orders":
  return <OrderBook user={user} />;


      case "monthly-summary":
        return <MonthlySummary />;

      case "inventory":
  return <InventoryPage user={user} />;

      case "settings":
        return <SettingsPage user={user} onLogout={onLogout} />;

      default:
        return <DashboardHome onNavigate={setCurrentPage} />;
    }
  };

  /* ================================
     LAYOUT
     ================================ */
  return (
    <div className={darkMode ? "dark" : ""}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Sidebar
          currentPage={currentPage}
          onNavigate={setCurrentPage}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          permissions={modulePermissions}
        />

        <div className="lg:pl-64">
          <TopBar
            user={user}
            onMenuClick={() => setSidebarOpen(true)}
            darkMode={darkMode}
            onToggleDarkMode={() => setDarkMode(!darkMode)}
            onAdminClick={() =>
              setCurrentPage(currentPage === "admin" ? "dashboard" : "admin")
            }
            isAdminView={currentPage === "admin"}
          />

          <main className="p-6">{renderPage()}</main>
        </div>
      </div>
    </div>
  );
}