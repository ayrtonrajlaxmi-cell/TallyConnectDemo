import {
  LayoutDashboard,
  BookOpen,
  FileText,
  ShoppingCart,
  TrendingUp,
  Package,
  Settings,
  X,
  Building2,
} from "lucide-react";
import { PageType } from "./DashboardLayout";


interface SidebarProps {
  currentPage: PageType;
  onNavigate: (page: PageType) => void;
  isOpen: boolean;
  onClose: () => void;
  permissions?: Record<string, boolean>;
}

const menuItems = [
  { id: "dashboard" as PageType, label: "Dashboard", icon: LayoutDashboard },
  { id: "ledgers" as PageType, label: "Ledger List", icon: BookOpen },
  { id: "vouchers" as PageType, label: "Voucher Explorer", icon: FileText },
  { id: "orders" as PageType, label: "Order Book", icon: ShoppingCart },
  {
    id: "monthly-summary" as PageType,
    label: "Monthly Summary",
    icon: TrendingUp,
  },
  { id: "inventory" as PageType, label: "Inventory", icon: Package },
  { id: "settings" as PageType, label: "Settings", icon: Settings },
];

export function Sidebar({
  currentPage,
  onNavigate,
  isOpen,
  onClose,
  permissions, // ✅ ADD THIS
}: SidebarProps) {

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
        fixed top-0 left-0 z-50 h-full w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700
        transition-transform duration-300 ease-in-out
        ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-600 rounded-lg">
                  <Building2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-gray-900 dark:text-white">Tally Cloud</h1>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Accounting Manager
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="lg:hidden p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
          </div>

          {/* Tally Connection Status */}
          <div className="px-6 py-4 bg-green-50 dark:bg-green-900/20 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 text-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-green-700 dark:text-green-400">
                Tally Connected
              </span>
            </div>
            <p className="text-xs text-green-600 dark:text-green-500 mt-1">
              Last sync: 2 mins ago
            </p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 overflow-y-auto">
            <ul className="space-y-1">
              {menuItems
  .filter((item) => permissions?.[item.id] !== false)
  .map((item) => {

                const Icon = item.icon;
                const isActive = currentPage === item.id;
                return (
                  <li key={item.id}>
                    <button
                      onClick={() => {
                        onNavigate(item.id);
                        onClose();
                      }}
                      className={`
                        w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors
                        ${
                          isActive
                            ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
                            : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        }
                      `}
                    >
                      <Icon className="w-5 h-5" />
                      <span>{item.label}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
      </aside>
    </>
  );
}