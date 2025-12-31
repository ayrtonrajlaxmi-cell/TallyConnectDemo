import { useEffect, useMemo, useState } from "react";
import axios from "axios";


import {
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle,
  Calendar,
  ArrowUpRight,
  BookOpen,
  FileText,
  ShoppingCart,
  Package,
  Download,
  FileSpreadsheet, // Added for UI consistency
  FileText as PdfIcon, // Added for UI consistency
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";
import { PageType } from "./DashboardLayout";

// Import for export functionality
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface DashboardHomeProps {
  onNavigate: (page: PageType) => void;
  user: any;
}


export function DashboardHome({ onNavigate, user }: DashboardHomeProps) {

 
  const [showExport, setShowExport] = useState(false);
  const [ledgers, setLedgers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCompanyGuid, setActiveCompanyGuid] = useState<string | null>(null);

const dashboardPerms = user?.dashboardPermissions?.widgets || {};



const isAdmin = user?.role === "ADMIN";

const canShow = (key: string) =>
  isAdmin || dashboardPerms[key] !== false;




  /* ================= EXPORT LOGIC (UNCHANGED) ================= */

  const exportExcel = () => {
    const statsData = stats.map((s) => ({
      Metric: s.label,
      Value: s.value.replace("₹", ""),
      Change: s.change,
      Trend: s.trend,
    }));
    const wsStats = XLSX.utils.json_to_sheet(statsData);
    const overviewReportData = overviewData.map((d) => ({
      Month: d.name,
      Income: d.income,
      Expense: d.expense,
      Net: d.income - d.expense,
    }));
    const wsOverview = XLSX.utils.json_to_sheet(overviewReportData);
    const outstandingReportData = outstandingData.map((d) => ({
      Month: d.month,
      Outstanding: d.outstanding,
    }));
    const wsOutstanding = XLSX.utils.json_to_sheet(outstandingReportData);
    const upcomingDuesReportData = upcomingDues.map((d) => ({
      "Party Name": d.party,
      Amount: d.amount,
      "Due Date": d.dueDate,
      "Days Left": d.days,
    }));
    const wsDues = XLSX.utils.json_to_sheet(upcomingDuesReportData);

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, wsStats, "Key Metrics");
    XLSX.utils.book_append_sheet(wb, wsOverview, "Income_Expense");
    XLSX.utils.book_append_sheet(wb, wsOutstanding, "Outstanding_Trend");
    XLSX.utils.book_append_sheet(wb, wsDues, "Upcoming Dues");

    const buffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(
      new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      }),
      "Dashboard_Report.xlsx"
    );
    setShowExport(false);
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    let finalY = 15;
    doc.text("Dashboard Summary Report", 14, finalY);
    finalY += 10;

    autoTable(doc, {
      startY: finalY,
      head: [["Metric", "Value", "Change", "Trend"]],
      body: stats.map((s) => [s.label, s.value, s.change, s.trend]),
      headStyles: { fillColor: [59, 130, 246] },
      didDrawPage: (data) => {
        finalY = data.cursor.y + 10;
      },
    });

    autoTable(doc, {
      startY: finalY,
      head: [["Month", "Income", "Expense", "Net"]],
      body: overviewData.map((d) => [
        d.name,
        `₹${d.income.toLocaleString()}`,
        `₹${d.expense.toLocaleString()}`,
        `₹${(d.income - d.expense).toLocaleString()}`,
      ]),
      headStyles: { fillColor: [16, 185, 129] },
      didDrawPage: (data) => {
        finalY = data.cursor.y + 10;
      },
    });

    doc.save("Dashboard_Report.pdf");
    setShowExport(false);
  };
useEffect(() => {
  const fetchDashboardData = async () => {
    try {
      // 1️⃣ Get active company
      const companyRes = await axios.get(
        "http://localhost:4000/company/active"
      );

      if (!companyRes.data?.company_guid) {
        console.warn("No active company");
        setLedgers([]);
        return;
      }

      const companyGuid = companyRes.data.company_guid;
      setActiveCompanyGuid(companyGuid);

      // 2️⃣ Fetch ledgers for that company
      const ledgerRes = await axios.get(
  "http://localhost:4000/ledger",
  {
    params: { company_guid: companyGuid },
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  }
);


      console.log("Ledger data:", ledgerRes.data.data);
      setLedgers(ledgerRes.data.data || []);
    } catch (err) {
      console.error("Dashboard fetch failed", err);
      setLedgers([]);
    } finally {
      setLoading(false);
    }
  };

  fetchDashboardData();
}, []);

const getLedgerNature = (ledger: any): "Dr" | "Cr" => {
  const group = (ledger.parent_group || "").toLowerCase();

  // CREDITORS / PAYABLES
  if (
    group.includes("sundry creditor") ||
    group.includes("creditor") ||
    group.includes("liability") ||
    group.includes("loan") ||
    group.includes("capital")
  ) {
    return "Cr";
  }

  // DEBTORS / RECEIVABLES
  if (
    group.includes("sundry debtor") ||
    group.includes("debtor") ||
    group.includes("asset") ||
    group.includes("expense")
  ) {
    return "Dr";
  }

  return "Dr";
};




const normalizedLedgers = useMemo(() => {
  return ledgers.map((l) => {
    const nature = getLedgerNature(l);
    const rawBalance = Number(l.closing_balance || 0);

let outstanding = 0;

if (nature === "Dr") {
  outstanding = rawBalance > 0 ? rawBalance : 0;
}

if (nature === "Cr") {
  outstanding = rawBalance < 0 ? Math.abs(rawBalance) : 0;
}




    return {
      ...l,
      type: nature,
      outstanding,
      dueDays: 0,
    };
  });
}, [ledgers]);






const stats = useMemo(() => {
  const receivables = normalizedLedgers
    .filter(l => l.type === "Dr" && l.outstanding > 0)
    .reduce((sum, l) => sum + l.outstanding, 0);

  const payables = normalizedLedgers
    .filter(l => l.type === "Cr" && l.outstanding > 0)
    .reduce((sum, l) => sum + l.outstanding, 0);
console.log("Dashboard widget perms:", dashboardPerms);

console.log(
  "Creditor ledgers with balances:",
  normalizedLedgers
    .filter(l => l.type === "Cr")
    .map(l => ({
      name: l.name,
      parent_group: l.parent_group,
      closing_balance: l.closing_balance,
      outstanding: l.outstanding,
    }))
);


  return [
    {
      label: "Total Receivables",
      value: `₹${receivables.toLocaleString()}`,
      trend: "up",
      change: "",
      icon: TrendingUp,
      color: "blue",
    },
    {
      label: "Total Payables",
      value: `₹${payables.toLocaleString()}`,
      trend: "down",
      change: "",
      icon: TrendingDown,
      color: "orange",
    },
    {
      label: "Pending Bills",
      value: normalizedLedgers.filter(l => l.outstanding > 0).length.toString(),
      trend: "up",
      change: "",
      icon: AlertCircle,
      color: "red",
    },
    {
      label: "Cleared Bills",
      value: normalizedLedgers.filter(l => l.outstanding <= 0).length.toString(),
      trend: "up",
      change: "",
      icon: CheckCircle,
      color: "green",
    },
  ];
}, [normalizedLedgers]);




const overviewData = useMemo(() => {
  const income = normalizedLedgers
    .filter(l => l.type === "Cr")
    .reduce((sum, l) => sum + l.outstanding, 0);

  const expense = normalizedLedgers
    .filter(l => l.type === "Dr")
    .reduce((sum, l) => sum + l.outstanding, 0);

  return [
    {
      name: "Current",
      income,
      expense,
    },
  ];
}, [normalizedLedgers]);


const outstandingData = useMemo(() => {
  return normalizedLedgers.map(l => ({
    month: l.name,
    outstanding: l.outstanding,
  }));
}, [normalizedLedgers]);



const upcomingDues = useMemo(() => {
  return normalizedLedgers
    .filter(l => l.outstanding > 0 && l.dueDays >= 0)
    .sort((a, b) => a.dueDays - b.dueDays)
    .slice(0, 5)
    .map(l => ({
      party: l.name,
      amount: l.outstanding,
      dueDate: l.date,
      days: l.dueDays,
    }));
}, [normalizedLedgers]);


const quickLinks = [
  { label: "Ledger List", icon: BookOpen, page: "ledgers", color: "blue" },
  { label: "Voucher Explorer", icon: FileText, page: "vouchers", color: "purple" },
  { label: "Order Book", icon: ShoppingCart, page: "orders", color: "orange" },
  { label: "Inventory", icon: Package, page: "inventory", color: "green" },
];
if (loading) {
  return <div className="p-6">Loading dashboard...</div>;
}

const quickLinkPermissionMap: Record<string, string> = {
  "Ledger List": "ledgers",
  "Voucher Explorer": "vouchers",
  "Order Book": "orders",
  "Inventory": "inventory",
};


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900 dark:text-white">
            Dashboard Overview
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Welcome back! Here's what's happening today.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <Calendar className="w-4 h-4" />
            <span>December 8, 2025</span>
          </div>

          {/* UPDATED EXPORT UI */}
          <div className="relative">
            {canShow("incomeExpenseChart") && (
  <button
    onClick={() => setShowExport(!showExport)}
    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm shadow-sm"
  >
    <Download className="w-4 h-4" />
    Export Report
  </button>
)}


{canShow("incomeExpenseChart") && showExport && (
              <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-50 overflow-hidden">
                <button
                  onClick={exportExcel}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 text-left transition-colors"
                >
                  <FileSpreadsheet className="w-4 h-4 text-green-600" />
                  Excel
                </button>
                <button
                  onClick={exportPDF}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 text-left transition-colors"
                >
                  <PdfIcon className="w-4 h-4 text-red-600" />
                  PDF
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Rest of the UI remains exactly the same... */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
       {stats
  .filter(stat => {
    const map: any = {
      "Total Receivables": "totalReceivables",
      "Total Payables": "totalPayables",
      "Pending Bills": "pendingBills",
      "Cleared Bills": "clearedBills",
    };
    return canShow(map[stat.label]);
  })
  .map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {stat.label}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                    {stat.value}
                  </p>
                  <div
                    className={`flex items-center gap-1 mt-2 text-sm ${
                      stat.trend === "up" ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    <ArrowUpRight
                      className={`w-4 h-4 ${
                        stat.trend === "down" ? "rotate-90" : ""
                      }`}
                    />
                    <span>{stat.change}</span>
                  </div>
                </div>
                <div
                  className={`p-3 rounded-lg bg-${stat.color}-50 dark:bg-${stat.color}-900/20`}
                >
                  <Icon
                    className={`w-6 h-6 text-${stat.color}-600 dark:text-${stat.color}-400`}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

    {/* Charts Section */}
<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
  {canShow("incomeExpenseChart") && (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
      Monthly
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={overviewData}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
          <XAxis dataKey="name" axisLine={false} tickLine={false} />
          <YAxis axisLine={false} tickLine={false} />
          <Tooltip cursor={{ fill: "transparent" }} />
          <Legend />
          <Bar dataKey="income" fill="#10B981" name="Income" />
          <Bar dataKey="expense" fill="#EF4444" name="Expense" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )}

  {canShow("outstandingTrends") && (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
      Outstanding
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={outstandingData}>
  <defs>
    <linearGradient id="colorOutstanding" x1="0" y1="0" x2="0" y2="1">
      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
    </linearGradient>
  </defs>

  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
  <XAxis dataKey="month" axisLine={false} tickLine={false} />
  <YAxis axisLine={false} tickLine={false} />
  <Tooltip />
  <Area
    type="monotone"
    dataKey="outstanding"
    stroke="#3B82F6"
    fillOpacity={1}
    fill="url(#colorOutstanding)"
  />
</AreaChart>

      </ResponsiveContainer>
    </div>
  )}
</div>


         {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-gray-900 dark:text-white font-semibold mb-4">
            Quick Links
          </h3>

          <div className="grid grid-cols-1 gap-3">
            {quickLinks
              .filter(link => canShow(quickLinkPermissionMap[link.label]))
              .map((link, index) => {
                const Icon = link.icon;

                return (
                  <button
                    key={index}
                    onClick={() => onNavigate(link.page)}
                    className="flex items-center gap-3 p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all text-left group"
                  >
                    <Icon className={`w-5 h-5 text-${link.color}-600`} />
                    <span className="text-gray-700 dark:text-gray-200 font-medium group-hover:text-blue-600 transition-colors">
                      {link.label}
                    </span>
                  </button>
                );
              })}
          </div>
        </div>

        {canShow("upcomingDueDates") && (
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-900 dark:text-white font-semibold">
                Upcoming Due Dates
              </h3>
              <button className="text-sm text-blue-600 hover:underline">
                View All
              </button>
            </div>

            <div className="space-y-3">
              {upcomingDues.map((due, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg"
                >
                  <div>
                    <p className="text-gray-900 dark:text-white font-medium">
                      {due.party}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Due: {due.dueDate}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-gray-900 dark:text-white font-bold">
                      ₹{due.amount.toLocaleString()}
                    </p>
                    <p className="text-xs mt-1 text-orange-500">
                      {due.days} days left
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
