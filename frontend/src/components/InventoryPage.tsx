import { useEffect, useState } from "react";
import axios from "axios";
import { Plus, Search, Edit, AlertTriangle } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export function InventoryPage({
  user,
}: {
  user: {
    role: "ADMIN" | "USER";
    inventoryPermissions?: {
      can_view?: boolean;
      columns?: Record<string, boolean>;
    };
  };
}) {


// 🔐 COLUMN PERMISSIONS
const columns =
  user.role === "ADMIN"
    ? {
        itemCode: true,
        itemName: true,
        opening: true,
        inward: true,
        outward: true,
        closingStock: true,
        rate: true,
        value: true,
        actions: true,
      }
    : {
        itemCode: false,
        itemName: false,
        opening: false,
        inward: false,
        outward: false,
        closingStock: false,
        rate: false,
        value: false,
        actions: false,
        ...(user?.inventoryPermissions?.columns || {}),
      };


  // ✅ HOOKS MUST BE HERE
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [showLowStock, setShowLowStock] = useState(false);
  const visibleColumnCount = Object.values(columns).filter(v => v !== false).length;


    // 🔐 PAGE ACCESS CHECK
if (user.role !== "ADMIN" && user?.inventoryPermissions?.can_view === false) {
  return (
    <div className="p-10 text-center text-gray-500">
      You do not have permission to view inventory.
    </div>
  );
}

  useEffect(() => {
    axios
      .get("http://localhost:4000/inventory")
      .then((res) => {
        setInventory(res.data);
      })
      .catch((err) => {
        console.error("Inventory fetch failed", err);
      })
      .finally(() => setLoading(false));
  }, []);

  // ✅ Prevent white screen during load
  if (loading) {
    return <div className="p-6">Loading inventory...</div>;
  }

  const filteredInventory = inventory.filter(item => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.id.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesLowStock =
      !showLowStock || item.closing < item.minStock;

    return matchesSearch && matchesLowStock;
  });

  const totalValue = inventory.reduce(
    (sum, item) => sum + (item.closing * item.rate),
    0
  );

  const lowStockItems = inventory.filter(
    item => item.closing < item.minStock
  ).length;

  const exportInventoryReport = () => {
  // Use filtered data (current tab/search/filters)
  const dataToExport = filteredInventory;

  if (!dataToExport.length) {
    alert("No data to export");
    return;
  }

  // Get only visible columns
  const visibleColumns = Object.entries(columns)
    .filter(([_, value]) => value !== false && _ !== "actions")
    .map(([key]) => key);

  // Column labels (CSV headers)
  const columnLabels: Record<string, string> = {
    itemCode: "Item Code",
    itemName: "Item Name",
    opening: "Opening",
    inward: "Inward",
    outward: "Outward",
    closingStock: "Closing Stock",
    rate: "Rate",
    value: "Value",
  };

  // Create CSV header
  const header = visibleColumns
    .map((col) => columnLabels[col] ?? col)
    .join(",");

  // Create CSV rows
  const rows = dataToExport.map((item) => {
    return visibleColumns
      .map((col) => {
        switch (col) {
          case "itemCode":
            return item.id;
          case "itemName":
            return `"${item.name}"`;
          case "opening":
            return item.opening;
          case "inward":
            return item.inward;
          case "outward":
            return item.outward;
          case "closingStock":
            return item.closing;
          case "rate":
            return item.rate;
          case "value":
            return item.closing * item.rate;
          default:
            return "";
        }
      })
      .join(",");
  });

  const csvContent = [header, ...rows].join("\n");

  // Download CSV
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.setAttribute(
    "download",
    `inventory-report-${user.role.toLowerCase()}.csv`
  );

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const exportInventoryPDF = () => {
  const dataToExport = filteredInventory;

  if (!dataToExport.length) {
    alert("No data to export");
    return;
  }

  const doc = new jsPDF("landscape");

  doc.setFontSize(14);
  doc.text("Inventory Report", 14, 15);

  // Visible columns only
  const visibleColumns = Object.entries(columns)
    .filter(([_, value]) => value !== false && _ !== "actions")
    .map(([key]) => key);

  const columnLabels: Record<string, string> = {
    itemCode: "Item Code",
    itemName: "Item Name",
    opening: "Opening",
    inward: "Inward",
    outward: "Outward",
    closingStock: "Closing Stock",
    rate: "Rate",
    value: "Value",
  };

  const tableHead = [
    visibleColumns.map((col) => columnLabels[col] ?? col),
  ];

  const tableBody = dataToExport.map((item) =>
    visibleColumns.map((col) => {
      switch (col) {
        case "itemCode":
          return item.id;
        case "itemName":
          return item.name;
        case "opening":
          return item.opening;
        case "inward":
          return item.inward;
        case "outward":
          return item.outward;
        case "closingStock":
          return item.closing;
        case "rate":
          return item.rate;
        case "value":
          return item.closing * item.rate;
        default:
          return "";
      }
    })
  );

  autoTable(doc, {
    head: tableHead,
    body: tableBody,
    startY: 25,
    styles: {
      fontSize: 9,
    },
    headStyles: {
      fillColor: [255, 115, 0], // orange header
    },
  });

  doc.save(`inventory-report-${user.role.toLowerCase()}.pdf`);
};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl text-gray-900 dark:text-white">Inventory Management</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Track and manage your stock items</p>
        </div>
        <div className="flex gap-2">
  {(user.role === "ADMIN" || user.inventoryPermissions?.can_view !== false) && (
    <>
      <button
        onClick={exportInventoryReport}
        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
      >
        Export CSV
      </button>

      <button
        onClick={exportInventoryPDF}
        className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
      >
        Export PDF
      </button>
    </>
  )}
</div>

      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400">Total Items</p>
          <p className="text-2xl text-gray-900 dark:text-white mt-2">{inventory.length}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400">Total Stock Value</p>
          <p className="text-2xl text-blue-600 dark:text-blue-400 mt-2">₹{totalValue.toLocaleString()}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400">Low Stock Alerts</p>
          <p className="text-2xl text-red-600 dark:text-red-400 mt-2">{lowStockItems}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400">Stock Movement</p>
          <p className="text-2xl text-green-600 dark:text-green-400 mt-2">Active</p>
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
              placeholder="Search by item name or code..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Filter buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => setShowLowStock(!showLowStock)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                showLowStock
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
              Low Stock Only
            </button>
          </div>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
              <tr>
                {columns.itemCode !== false && (
  <th className="px-6 py-4 text-left text-xs uppercase">
    Item Code
  </th>
)}

                {columns.itemName !== false && (
  <th className="px-6 py-4 text-left text-xs uppercase">
    Item name 
  </th>
)}
{columns.opening !== false && (
  <th className="px-6 py-4 text-left text-xs uppercase">
    Opening
  </th>
)}
{columns.inward !== false && (
  <th className="px-6 py-4 text-left text-xs uppercase">
    Inward
  </th>
)}
{columns.outward !== false && (
  <th className="px-6 py-4 text-left text-xs uppercase">
   Outward
  </th>
)}
{columns.closingStock !== false && (
  <th className="px-6 py-4 text-left text-xs uppercase">
    Closing Stock
  </th>
)}
{columns.rate !== false && (
  <th className="px-6 py-4 text-left text-xs uppercase">
    Rate
  </th>
)}
{columns.value !== false && (
  <th className="px-6 py-4 text-left text-xs uppercase">
    Value
  </th>
)}
{columns.actions !== false && (
  <th className="px-6 py-4 text-left text-xs uppercase">
   Action
  </th>
)}

              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredInventory.map((item) => {
                const isLowStock = item.closing < item.minStock;
                const value = item.closing * item.rate;
                return (
                  <tr key={item.id} className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
                    isLowStock ? 'bg-red-50 dark:bg-red-900/10' : ''
                  }`}>
                    {columns.itemCode !== false && (
  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
    {item.id}
  </td>
)}

{columns.itemName !== false && (
  <td className="px-6 py-4">
    <div>
      <p className="text-sm text-gray-900 dark:text-white">{item.name}</p>
      {isLowStock && (
        <div className="flex items-center gap-1 mt-1 text-xs text-red-600">
          <AlertTriangle className="w-3 h-3" />
          Low Stock Alert
        </div>
                        )}
                      </div>
                    </td>

                    )}
{columns.opening !== false && (
  <td className="px-6 py-4 text-right">{item.opening}</td>
)}

{columns.inward !== false && (
  <td className="px-6 py-4 text-right">+{item.inward}</td>
)}

{columns.outward !== false && (
  <td className="px-6 py-4 text-right">-{item.outward}</td>
)}

{columns.closingStock !== false && (
  <td className="px-6 py-4 text-right">{item.closing}</td>
)}

{columns.rate !== false && (
  <td className="px-6 py-4 text-right">₹{item.rate}</td>
)}
 {columns.value !== false && (
  <td className="px-6 py-4 text-right">₹{value.toLocaleString()}</td>
)}
                    {columns.actions !== false && (
  <td className="px-6 py-4 text-center">
    <button className="p-1.5 hover:bg-blue-100 rounded">
      <Edit className="w-4 h-4 text-blue-600" />
    </button>
  </td>
)}

                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-gray-50 dark:bg-gray-700/50 border-t-2 border-gray-300 dark:border-gray-600">
              <tr>
                
<td colSpan={visibleColumnCount - 2}>
  Total Inventory Value
</td>

                {columns.value !== false && (
  <td className="px-6 py-4 text-sm text-right">
    ₹{totalValue.toLocaleString()}
  </td>
)}

                {columns.actions !== false && <td></td>}

              </tr>
            </tfoot>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Showing {filteredInventory.length} items
          </p>
          <div className="flex gap-2">
            <button className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              Previous
            </button>
            <button className="px-3 py-1 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors">
              1
            </button>
            <button className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
