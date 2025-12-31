import { useState, useEffect } from "react";
import axios from "axios";
import {
  Search,
  Bell,
  Menu,
  Moon,
  Sun,
  ShieldCheck,
  LogOut,
  ChevronDown,
  Building2,
} from "lucide-react";


interface TopBarProps {
  user: {
    username: string;
    company: string;
role: "ADMIN" | "USER";
  };
  onMenuClick: () => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onAdminClick: () => void;
  isAdminView?: boolean;
}

interface Company {
  company_guid: string;
  name: string;
}

export function TopBar({
  user,
  onMenuClick,
  darkMode,
  onToggleDarkMode,
  onAdminClick,
  isAdminView = false,
}: TopBarProps) {
  const [searchQuery, setSearchQuery] = useState("");
const isAdmin = user.role === "ADMIN";


const [companies, setCompanies] = useState<Company[]>([]);
const [showCompanies, setShowCompanies] = useState(false);
const [activeCompany, setActiveCompany] = useState<string>(user.company);
useEffect(() => {
  async function fetchCompanies() {
    try {
const token = localStorage.getItem("token");

const res = await axios.get("http://localhost:4000/company", {
  headers: {
    Authorization: `Bearer ${token}`,
  },
});
      if (res.data.success) {
        setCompanies(res.data.data);
      }
    } catch (err) {
      console.error("Failed to load companies", err);
    }
  }

  fetchCompanies();
}, []);

useEffect(() => {
  setActiveCompany(user.company);
}, [user.company]);

useEffect(() => {
  function handleClickOutside(e: MouseEvent) {
    if (!(e.target as HTMLElement).closest(".company-dropdown")) {
      setShowCompanies(false);
    }
  }

  document.addEventListener("click", handleClickOutside);
  return () => document.removeEventListener("click", handleClickOutside);
}, []);

  // Using specific hex codes for a premium look
  const activeRed = "#f43f5e"; // Rose 500
  const activeGreen = "#10b981"; // Emerald 500

  return (
    <header className="sticky top-0 z-30 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 md:px-6 py-4">
      <div className="flex items-center justify-between gap-4">
        {/* LEFT */}
        <div className="flex items-center gap-4 flex-1">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <Menu className="w-6 h-6 text-gray-700 dark:text-gray-300" />
          </button>

          <div className="relative flex-1 max-w-md hidden sm:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search..."
              className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none"
            />
          </div>
        </div>

        {/* RIGHT */}
        <div className="flex items-center gap-3">
          {/* ✅ FIXED ADMIN BUTTON WITH INLINE STYLE */}
          {isAdmin && (
            <button
              onClick={onAdminClick}
              style={{
                backgroundColor: isAdminView ? activeRed : activeGreen,
                color: "white",
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-transform active:scale-95 shadow-lg border-none"
            >
              {isAdminView ? (
                <>
                  <LogOut className="w-4 h-4 text-white" />
                  <span className="text-white">Exit Admin</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4 text-white" />
                  <span className="text-white">Admin Panel</span>
                </>
              )}
            </button>
          )}
{/* 🏢 COMPANY DROPDOWN (ADMIN ONLY) */}
{isAdmin && (
  <div className="relative company-dropdown">
    <button
      onClick={() => setShowCompanies(!showCompanies)}
      className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-600"
    >
      <Building2 className="w-4 h-4" />
      <span className="max-w-[140px] truncate">{activeCompany}</span>
      <ChevronDown className="w-4 h-4" />
    </button>

    {showCompanies && (
      <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
        {companies.map((c) => (
          <button
            key={c.company_guid}
            onClick={async () => {
              try {
                const token = localStorage.getItem("token");

                await axios.post(
                  "http://localhost:4000/company/set-active",
                  { company_guid: c.company_guid },
                  {
                    headers: {
                      Authorization: `Bearer ${token}`,
                    },
                  }
                );
// 🔥 ADD THIS
await axios.post("http://localhost:4000/agent/force-sync");
                setActiveCompany(c.name);
                setShowCompanies(false);

                console.log("✅ Active company switched to:", c.name);
              } catch (err) {
                console.error("❌ Failed to switch company", err);
              }
            }}
            className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 ${
              activeCompany === c.name
                ? "bg-gray-100 dark:bg-gray-700 font-semibold"
                : ""
            }`}
          >
            {c.name}
          </button>
        ))}

        {companies.length === 0 && (
          <div className="px-4 py-2 text-sm text-gray-500">
            No companies found
          </div>
        )}
      </div>
    )}
  </div>
)}


          {/* DARK MODE */}
          <button
            onClick={onToggleDarkMode}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            {darkMode ? (
              <Sun className="w-5 h-5 text-yellow-500" />
            ) : (
              <Moon className="w-5 h-5 text-gray-600" />
            )}
          </button>

          {/* NOTIFICATIONS */}
          <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
            <Bell className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>
    </header>
  );
}