import { useState, useEffect } from "react";
import { Search, Filter, Eye, Download } from "lucide-react";
import axios from "axios";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useMemo } from "react";

interface Ledger {
  ledger_guid: string;
  name: string;
  type: "Dr" | "Cr" | string;
  parent_group?: string;
  opening_balance: number;
  debit: number;
  credit: number;
  closing_balance: number;
  date?: string;
  voucher_type?: string;
  reference_no?: string;
  category?: "Customer" | "Supplier" | string;
}

interface LedgerListProps {
  onViewLedger: (ledgerId: string) => void;
  user: {
    ledgerPermissions?: {
      columns: Record<string, boolean>;
    };
  };
}


axios.get("http://localhost:4000/ledger", {
  headers: {
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  },
});


export function LedgerList({ onViewLedger, user }: LedgerListProps) {
const columns =
  user.role === "ADMIN"
    ? {
        partyName: true,
        type: true,
        opening: true,
        outstanding: true,
        dueDays: true,
        actions: true,
      }
    : user.ledgerPermissions?.columns || {
        partyName: true,
        type: true,
        opening: true,
        outstanding: true,
        dueDays: true,
        actions: true,
      };

  const [ledgers, setLedgers] = useState<Ledger[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "Dr" | "Cr">("all");
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(false);

  // ✅ MUST BE DEFINED FIRST (before use)
  const getLedgerNature = (ledger: Ledger): "Dr" | "Cr" => {
    const group = (ledger.parent_group || "").toLowerCase();

    if (
      group.includes("capital") ||
      group.includes("income") ||
      group.includes("liability")
    ) {
      return "Cr";
    }

    if (
      group.includes("asset") ||
      group.includes("expense") ||
      group.includes("debtor")
    ) {
      return "Dr";
    }

    return "Dr";
  };

  // Fetch ledgers
  useEffect(() => {
    const fetchLedgers = async () => {
      try {
        setLoading(true);
const response = await axios.get("http://localhost:4000/ledger", {
  headers: {
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  },
});
        setLedgers(response.data.data);
      } catch (error) {
        console.error("Failed to fetch ledgers:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLedgers();
  }, []);

  // Enrich data
const enrichedLedgers = useMemo(() => {
  return ledgers.map((ledger) => {
    const debit = Number(ledger.debit) || 0;
    const credit = Number(ledger.credit) || 0;

    return {
      ...ledger,
      debit,
      credit,
      outstanding: credit - debit,
      dueDays: ledger.date
        ? Math.ceil(
            (Date.now() - new Date(ledger.date).getTime()) /
              (1000 * 60 * 60 * 24)
          )
        : 0,
    };
  });
}, [ledgers]);


  // ✅ FILTER USING SAME LOGIC AS BADGE
 const filteredLedgers = useMemo(() => {
  return enrichedLedgers.filter((ledger) => {
    const matchesSearch = ledger.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());

    const nature = getLedgerNature(ledger);

    if (filterType === "Cr") return matchesSearch && nature === "Cr";
    if (filterType === "Dr") return matchesSearch && nature === "Dr";

    return matchesSearch;
  });
}, [enrichedLedgers, searchQuery, filterType]);


  const exportLedgerCSV = () => {
const dataToExport = [...filteredLedgers];

  if (!dataToExport.length) {
    alert("No data to export");
    return;
  }

  const visibleColumns = Object.entries(columns)
    .filter(([_, v]) => v !== false && _ !== "actions")
    .map(([k]) => k);

  const columnLabels: Record<string, string> = {
    partyName: "Party Name",
    type: "Type",
    opening: "Opening Balance",
    outstanding: "Outstanding",
    dueDays: "Due Days",
  };

  const header = visibleColumns
    .map(col => columnLabels[col] ?? col)
    .join(",");

  const rows = dataToExport.map(ledger =>
    visibleColumns.map(col => {
      switch (col) {
        case "partyName":
          return `"${ledger.name}"`;
        case "type":
          return getLedgerNature(ledger);
        case "opening":
          return ledger.opening_balance;
        case "outstanding":
          return ledger.outstanding;
        case "dueDays":
          return ledger.dueDays;
        default:
          return "";
      }
    }).join(",")
  );

  const csvContent = [header, ...rows].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = "ledger-list.csv";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
const exportLedgerPDF = () => {
const dataToExport = [...filteredLedgers];

  if (!dataToExport.length) {
    alert("No data to export");
    return;
  }

  const doc = new jsPDF("landscape");

  doc.setFontSize(14);
  doc.text("Ledger List Report", 14, 15);

  const visibleColumns = Object.entries(columns)
    .filter(([_, v]) => v !== false && _ !== "actions")
    .map(([k]) => k);

  const columnLabels: Record<string, string> = {
    partyName: "Party Name",
    type: "Type",
    opening: "Opening Balance",
    outstanding: "Outstanding",
    dueDays: "Due Days",
  };

  const tableHead = [
    visibleColumns.map(col => columnLabels[col] ?? col),
  ];

  const tableBody = dataToExport.map(ledger =>
    visibleColumns.map(col => {
      switch (col) {
        case "partyName":
          return ledger.name;
        case "type":
          return getLedgerNature(ledger) === "Dr" ? "Debit" : "Credit";
        case "opening":
  return `Rs. ${ledger.opening_balance.toLocaleString("en-IN")}`;

case "outstanding":
  return `Rs. ${ledger.outstanding.toLocaleString("en-IN")}`;
        case "dueDays":
          return `${ledger.dueDays} days`;
        default:
          return "";
      }
    })
  );

  autoTable(doc, {
    head: tableHead,
    body: tableBody,
    startY: 25,
    styles: { fontSize: 9 },
    headStyles: { fillColor: [37, 99, 235] }, // blue header
  });

  doc.save("ledger-list.pdf");
};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl text-gray-900 dark:text-white">Ledger List</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            View and manage all party ledgers
          </p>
        </div>
       <div className="flex gap-2">
  <button
    onClick={exportLedgerCSV}
    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
  >
    <Download className="w-4 h-4" />
    Export CSV
  </button>

  <button
    onClick={exportLedgerPDF}
    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
  >
    <Download className="w-4 h-4" />
    Export PDF
  </button>
</div>

      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by party name..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Type Filter */}
          <div className="flex gap-2">
            <button
              onClick={() => setFilterType("all")}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filterType === "all"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterType("Dr")}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filterType === "Dr"
                  ? "bg-green-600 text-white"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
            >
              Debit
            </button>
            <button
              onClick={() => setFilterType("Cr")}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filterType === "Cr"
                  ? "bg-red-600 text-white"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
            >
              Credit
            </button>
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            <Filter className="w-4 h-4" />
            More Filters
          </button>
        </div>

        {/* Extended Filters */}
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div>
              <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">
                Date Range
              </label>
              <div className="flex gap-2">
                <input
                  type="date"
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="date"
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">
                Amount Range
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="number"
                  placeholder="Max"
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">
                Category
              </label>
              <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option>All Categories</option>
                <option>Customer</option>
                <option>Supplier</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Ledger Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        {loading ? (
          <p className="p-6 text-center text-gray-500 dark:text-gray-400">
            Loading ledgers...
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                <tr>
                  {columns.partyName !== false && (
  <th className="px-6 py-4 text-left text-xs uppercase">Party Name</th>
)}

{columns.type !== false && (
  <th className="px-6 py-4 text-left text-xs uppercase">Type</th>
)}

{columns.opening !== false && (
  <th className="px-6 py-4 text-right text-xs uppercase">Opening Balance</th>
)}

{columns.outstanding !== false && (
  <th className="px-6 py-4 text-right text-xs uppercase">Outstanding</th>
)}

{columns.dueDays !== false && (
  <th className="px-6 py-4 text-center text-xs uppercase">Due Days</th>
)}

{columns.actions !== false && (
  <th className="px-6 py-4 text-center text-xs uppercase">Actions</th>
)}

                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredLedgers.map((ledger) => (
                  <tr
  key={ledger.ledger_guid}
  className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
>
  {columns.partyName !== false && (
    <td className="px-6 py-4">
      <div>
        <p className="text-gray-900 dark:text-white">{ledger.name}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {ledger.category || ledger.parent_group}
        </p>
      </div>
    </td>
  )}

  {columns.type !== false && (
    <td className="px-6 py-4">
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs ${
          ledger.type === "Dr"
            ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400"
            : "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400"
        }`}
      >
{getLedgerNature(ledger) === "Dr" ? "Debit" : "Credit"}
      </span>
    </td>
  )}

  {columns.opening !== false && (
    <td className="px-6 py-4 text-right text-gray-900 dark:text-white">
      ₹{ledger.opening_balance.toLocaleString()}
    </td>
  )}

  {columns.outstanding !== false && (
    <td className="px-6 py-4 text-right text-gray-900 dark:text-white">
      ₹{ledger.outstanding.toLocaleString()}
    </td>
  )}

  {columns.dueDays !== false && (
    <td className="px-6 py-4 text-center">
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs ${
          ledger.dueDays <= 7
            ? "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400"
            : ledger.dueDays <= 15
            ? "bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-400"
            : "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400"
        }`}
      >
        {ledger.dueDays} days
      </span>
    </td>
  )}

  {columns.actions !== false && (
    <td className="px-6 py-4 text-center">
      <button
        onClick={() => onViewLedger(ledger.ledger_guid)}
        className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
      >
        <Eye className="w-4 h-4" />
        View Details
      </button>
    </td>
  )}
</tr>

                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
