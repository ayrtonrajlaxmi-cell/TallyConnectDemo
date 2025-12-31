import { useState, useEffect } from "react";
import { Edit, Trash2, Search } from "lucide-react";
import axios from "axios";


interface Voucher {
  id: string;
  date: string;
  type: string;
  amount: number;
  refNo: string;
  party: string;
  status: string;
}

interface VoucherExplorerProps {
  user: {
    vouchersPermissions?: {
  can_view?: boolean;
  columns: Record<string, boolean>;
};

  };
}
const voucherTypes = ["All", "Sales", "Purchase", "Payment", "Receipt", "Journal"];
const statusTypes = ["All Status", "Draft", "Approved", "Cleared"];

export function VoucherExplorer({ user }: VoucherExplorerProps) {
  console.log(
  "VoucherExplorer permissions:",
  user?.vouchersPermissions
);

   // 🔐 STEP 1: ENFORCE VOUCHER ACCESS
if (user.role !== "ADMIN" && user?.vouchersPermissions?.can_view === false) {
    return (
      <div className="p-10 text-center text-gray-500">
        You do not have permission to view vouchers.
      </div>
    );
  }
const columns = {
  date: true,
  type: true,
  refNo: true,
  party: true,
  amount: true,
  status: true,
  actions: true,
...user?.vouchersPermissions?.columns
};


  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All Status");
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");

  // Fetch ledger data from backend
useEffect(() => {
  const fetchVouchers = async () => {
    try {
      setLoading(true);

      const response = await axios.get("http://localhost:4000/voucher-entry", {
  headers: {
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  },
});


      const voucherData = response.data.data || [];

      const formattedVouchers: Voucher[] = voucherData.map((v: any) => ({
        id: v.voucher_guid,
        date: v.voucher_date,
        type: v.voucher_type,
        refNo: v.reference_no || "",
        party: v.party_name || v.party,
        amount: Number(v.amount),
        status: v.is_active ? "Approved" : "Cancelled",
      }));

      setVouchers(formattedVouchers);
    } catch (error) {
      console.error("Failed to fetch vouchers:", error);
    } finally {
      setLoading(false);
    }
  };

  fetchVouchers();
}, []);


  // Filter vouchers dynamically
  const filteredVouchers = vouchers.filter((voucher) => {
  const refNo = voucher.refNo || "";
  const party = voucher.party || "";

  const matchesType =
    selectedType === "All" || voucher.type === selectedType;

  const matchesStatus =
    selectedStatus === "All Status" ||
    voucher.status === selectedStatus;

  const matchesSearch =
    refNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
    party.toLowerCase().includes(searchQuery.toLowerCase());

  const matchesFromDate = fromDate
    ? new Date(voucher.date) >= new Date(fromDate)
    : true;

  const matchesToDate = toDate
    ? new Date(voucher.date) <= new Date(toDate)
    : true;

  return (
    matchesType &&
    matchesStatus &&
    matchesSearch &&
    matchesFromDate &&
    matchesToDate
  );
});

const visibleColumnCount = [
  columns.date,
  columns.type,
  columns.refNo,
  columns.party,
  columns.amount,
  columns.status,
  columns.actions,
].filter(c => c !== false).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl text-gray-900 dark:text-white">Voucher Explorer</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage all your vouchers and transactions
          </p>
        </div>
       
      </div>




      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by reference number or party..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto">
            {voucherTypes.map((type) => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                  selectedType === type
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div>
            <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">From Date</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">To Date</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {statusTypes.map((status) => (
                <option key={status}>{status}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Voucher Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        {loading ? (
          <p className="p-6 text-center text-gray-500 dark:text-gray-400">Loading vouchers...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
  <tr>
    {columns.date !== false && (
      <th className="px-6 py-4 text-left text-xs uppercase">Date</th>
    )}
    {columns.type !== false && (
      <th className="px-6 py-4 text-left text-xs uppercase">Voucher Type</th>
    )}
    {columns.refNo !== false && (
      <th className="px-6 py-4 text-left text-xs uppercase">Reference No.</th>
    )}
    {columns.party !== false && (
      <th className="px-6 py-4 text-left text-xs uppercase">Party</th>
    )}
    {columns.amount !== false && (
      <th className="px-6 py-4 text-right text-xs uppercase">Amount</th>
    )}
    {columns.status !== false && (
      <th className="px-6 py-4 text-center text-xs uppercase">Status</th>
    )}
    {columns.actions !== false && (
      <th className="px-6 py-4 text-center text-xs uppercase">Actions</th>
    )}
  </tr>
</thead>

              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredVouchers.map((voucher) => (
                 <tr
  key={voucher.id}
  className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
>
  {columns.date !== false && (
    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
      {voucher.date}
    </td>
  )}

  {columns.type !== false && (
    <td className="px-6 py-4">
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs ${
          voucher.type === "Sales" || voucher.type === "Receipt"
            ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400"
            : voucher.type === "Purchase" || voucher.type === "Payment"
            ? "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400"
            : "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400"
        }`}
      >
        {voucher.type}
      </span>
    </td>
  )}

  {columns.refNo !== false && (
    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
      {voucher.refNo}
    </td>
  )}

  {columns.party !== false && (
    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
      {voucher.party}
    </td>
  )}

  {columns.amount !== false && (
    <td className="px-6 py-4 text-sm text-right text-gray-900 dark:text-white">
      ₹{voucher.amount.toLocaleString()}
    </td>
  )}

  {columns.status !== false && (
    <td className="px-6 py-4 text-center">
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs ${
          voucher.status === "Approved"
            ? "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400"
            : voucher.status === "Cleared"
            ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400"
            : "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-400"
        }`}
      >
        {voucher.status}
      </span>
    </td>
  )}

  {columns.actions !== false && (
    <td className="px-6 py-4">
      <div className="flex items-center justify-center gap-2">
        <button className="p-1.5 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded transition-colors">
          <Edit className="w-4 h-4 text-blue-600 dark:text-blue-400" />
        </button>
        <button className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors">
          <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
        </button>
      </div>
    </td>
  )}
</tr>

                ))}
               {filteredVouchers.length === 0 && (
  <tr>
    <td
      colSpan={visibleColumnCount || 1}
      className="px-6 py-4 text-center text-gray-500 dark:text-gray-400"
    >
      No vouchers found.
    </td>
  </tr>
)}


              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

