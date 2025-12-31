import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Plus, Search, Download } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface Order {
  id: string;
  type: "Sales" | "Purchase";
  date: string;
  customer: string;
  amount: number;
  dueDate: string;
  status: "Pending" | "Completed" | "Cancelled";
}

export function OrderBook({
  user,
}: {
  user: {
    username: string;
    role: "ADMIN" | "USER";
    ordersPermissions?: {
      can_view?: boolean;
      columns?: Record<string, boolean>;
    };
  };
}) {
  // 🔐 ACCESS CHECK
  if (user.role !== "ADMIN" && user?.ordersPermissions?.can_view === false) {
    return (
      <div className="p-10 text-center text-gray-500">
        You do not have permission to view orders.
      </div>
    );
  }

  // 🔐 COLUMN PERMISSIONS
  const columns =
    user.role === "ADMIN"
      ? {
          orderNo: true,
          partyName: true,
          type: true,
          date: true,
          amount: true,
          status: true,
          dueDate: true,
          actions: true,
        }
      : {
          // ✅ DEFAULT: everything visible
          orderNo: true,
          partyName: true,
          type: true,
          date: true,
          amount: true,
          status: true,
          dueDate: true,
          actions: true,

          // 🔒 override only what admin disabled
          ...(user?.ordersPermissions?.columns || {}),
        };

  const hasAnyColumnAccess =
    user.role === "ADMIN" || Object.values(columns).some((v) => v !== false);

  if (!hasAnyColumnAccess) {
    return (
      <div className="p-10 text-center text-gray-500">
        You do not have access to view order details.
      </div>
    );
  }

  const [orders, setOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState<"all" | "sales" | "purchase">(
    "all"
  );
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await axios.get("http://localhost:4000/orders", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

        const formatted: Order[] = res.data.map((o: any) => ({
          id: String(o.id), // ✅ FIX: ensure string
          type: o.type === "Sales" ? "Sales" : "Purchase",
          date: o.date ? o.date.split("T")[0] : "-",
          customer: o.customer ?? "-",
          amount: Number(o.amount ?? 0),
          dueDate: o.due_date ? o.due_date.split("T")[0] : "-",
          status: o.status ?? "Pending",
        }));

        setOrders(formatted);
      } catch (err) {
        console.error("Order fetch failed", err);
      }
    };

    fetchOrders();
  }, []);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesTab =
        activeTab === "all" ||
        (activeTab === "sales" && order.type === "Sales") ||
        (activeTab === "purchase" && order.type === "Purchase");

      const matchesSearch =
        (order.id || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (order.customer || "")
          .toLowerCase()
          .includes(searchQuery.toLowerCase());

      return matchesTab && matchesSearch;
    });
  }, [orders, activeTab, searchQuery]);

  const stats = useMemo(
    () => ({
      total: orders.length,
      pending: orders.filter((o) => o.status === "Pending").length,
      completed: orders.filter((o) => o.status === "Completed").length,
      cancelled: orders.filter((o) => o.status === "Cancelled").length,
    }),
    [orders]
  );
  const exportOrdersCSV = () => {
    const dataToExport = filteredOrders;

    if (!dataToExport.length) {
      alert("No data to export");
      return;
    }

    const visibleColumns = Object.entries(columns)
      .filter(([_, v]) => v !== false && _ !== "actions")
      .map(([k]) => k);

    const columnLabels: Record<string, string> = {
      orderNo: "Order No",
      partyName: "Customer / Supplier",
      type: "Type",
      date: "Date",
      amount: "Amount",
      status: "Status",
      dueDate: "Due Date",
    };

    const header = visibleColumns
      .map((col) => columnLabels[col] ?? col)
      .join(",");

    const rows = dataToExport.map((order) =>
      visibleColumns
        .map((col) => {
          switch (col) {
            case "orderNo":
              return order.id;
            case "partyName":
              return `"${order.customer}"`;
            case "type":
              return order.type;
            case "date":
              return order.date;
            case "amount":
              return order.amount;
            case "status":
              return order.status;
            case "dueDate":
              return order.dueDate;
            default:
              return "";
          }
        })
        .join(",")
    );

    const csvContent = [header, ...rows].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `order-book-${user.role.toLowerCase()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportOrdersPDF = () => {
    const dataToExport = filteredOrders;

    if (!dataToExport.length) {
      alert("No data to export");
      return;
    }

    const doc = new jsPDF("landscape");

    doc.setFontSize(14);
    doc.text("Sales & Purchase Order Book", 14, 15);

    const visibleColumns = Object.entries(columns)
      .filter(([_, v]) => v !== false && _ !== "actions")
      .map(([k]) => k);

    const columnLabels: Record<string, string> = {
      orderNo: "Order No",
      partyName: "Customer / Supplier",
      type: "Type",
      date: "Date",
      amount: "Amount",
      status: "Status",
      dueDate: "Due Date",
    };

    const tableHead = [visibleColumns.map((col) => columnLabels[col] ?? col)];

    const tableBody = dataToExport.map((order) =>
      visibleColumns.map((col) => {
        switch (col) {
          case "orderNo":
            return order.id;
          case "partyName":
            return order.customer;
          case "type":
            return order.type;
          case "date":
            return order.date;
          case "amount":
            return `Rs. ${order.amount.toLocaleString("en-IN")}`;
          case "status":
            return order.status;
          case "dueDate":
            return order.dueDate;
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

    doc.save(`order-book-${user.role.toLowerCase()}.pdf`);
  };

  // UI BELOW REMAINS 100% SAME (no changes)
  // 👇 your existing JSX exactly as i
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl text-gray-900 dark:text-white">
            Sales & Purchase Order Book
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Track all your orders in one place
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportOrdersCSV}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>

          <button
            onClick={exportOrdersPDF}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            <Download className="w-4 h-4" />
            Export PDF
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Total Orders
          </p>
          <p className="text-2xl text-gray-900 dark:text-white mt-2">
            {stats.total}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400">Pending</p>
          <p className="text-2xl text-orange-600 dark:text-orange-400 mt-2">
            {stats.pending}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400">Completed</p>
          <p className="text-2xl text-green-600 dark:text-green-400 mt-2">
            {stats.completed}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400">Cancelled</p>
          <p className="text-2xl text-red-600 dark:text-red-400 mt-2">
            {stats.cancelled}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Tabs */}
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab("all")}
              className={`px-4 py-2 rounded-lg transition-colors ${
                activeTab === "all"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
            >
              All Orders
            </button>
            <button
              onClick={() => setActiveTab("sales")}
              className={`px-4 py-2 rounded-lg transition-colors ${
                activeTab === "sales"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
            >
              Sales Orders
            </button>
            <button
              onClick={() => setActiveTab("purchase")}
              className={`px-4 py-2 rounded-lg transition-colors ${
                activeTab === "purchase"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
            >
              Purchase Orders
            </button>
          </div>

          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by order number or customer..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
              <tr>
                {columns.orderNo !== false && (
                  <th className="px-6 py-4 text-left text-xs uppercase">
                    Order No.
                  </th>
                )}

                {columns.type !== false && (
                  <th className="px-6 py-4 text-left text-xs uppercase">
                    Type
                  </th>
                )}

                {columns.date !== false && (
                  <th className="px-6 py-4 text-left text-xs uppercase">
                    Date
                  </th>
                )}

                {columns.status !== false && (
                  <th className="px-6 py-4 text-center text-xs uppercase">
                    Status
                  </th>
                )}

                {columns.partyName !== false && (
                  <th className="px-6 py-4 text-left text-xs text-gray-600 uppercase">
                    Customer/Supplier
                  </th>
                )}

                {columns.amount !== false && (
                  <th className="px-6 py-4 text-right text-xs uppercase">
                    Amount
                  </th>
                )}

                {columns.dueDate !== false && (
                  <th className="px-6 py-4 text-left text-xs uppercase">
                    Due Date
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredOrders.map((order) => (
                <tr
                  key={order.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
                >
                  {columns.orderNo !== false && (
                    <td className="px-6 py-4 text-sm">{order.id}</td>
                  )}

                  {columns.type !== false && (
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs ${
                          order.type === "Sales"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {order.type}
                      </span>
                    </td>
                  )}

                  {columns.date !== false && (
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {order.date}
                    </td>
                  )}

                  {columns.partyName !== false && (
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {order.customer}
                    </td>
                  )}

                  {columns.amount !== false && (
                    <td className="px-6 py-4 text-sm text-right">
                      ₹{order.amount}
                    </td>
                  )}

                  {columns.dueDate !== false && (
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {order.dueDate}
                    </td>
                  )}

                  {columns.status !== false && (
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`inline-flex px-2 py-1 rounded-full text-xs ${
                          order.status === "Completed"
                            ? "bg-green-100 text-green-800"
                            : order.status === "Pending"
                            ? "bg-orange-100 text-orange-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {order.status}
                      </span>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Showing {filteredOrders.length} orders
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
