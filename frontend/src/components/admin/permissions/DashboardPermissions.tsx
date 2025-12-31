import { useEffect, useState } from "react";
import { Save, AlertTriangle } from "lucide-react";

export function DashboardPermissions({ value, user, onDone }: any) {
  const [local, setLocal] = useState({
    widgets: value?.widgets || {}, // ✅ ONLY saved permissions
  });

  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    setLocal({
      widgets: value?.widgets || {}, // ✅ sync when user changes
    });
  }, [value]);

  const toggle = (key: string) => {
    setLocal((prev: any) => ({
      ...prev,
      widgets: {
        ...prev.widgets,
        [key]: prev.widgets[key] === false ? true : false,
      },
    }));
  };

  const confirmSave = async () => {
    await fetch(
      `http://localhost:4000/users/${user.id}/dashboard-permissions`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(local),
      }
    );

    onDone?.();
  };

  return (
    <div className="p-6 space-y-6 w-full bg-white">
      {/* HEADER */}
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h2 className="text-lg font-black uppercase text-slate-900">
            Dashboard Permissions
          </h2>
          <p className="text-xs text-slate-500">
            {user?.name} · {user?.company}
          </p>
        </div>

        {/* SAVE BUTTON */}
        <button
          type="button"
onClick={() => setShowConfirm(true)}
          style={{ backgroundColor: "#059669", color: "#ffffff" }}
          className="flex items-center gap-2 px-6 py-2 rounded-lg
                     text-xs font-black uppercase shadow"
        >
          <Save size={16} color="#ffffff" />
          Save
        </button>
      </div>

      {/* PERMISSIONS TABLE */}
      <div className="border border-slate-200 rounded-xl overflow-hidden">
        <div
          className="flex justify-between px-4 py-3 bg-slate-50
                     text-xs font-black uppercase border-b"
        >
          <span className="text-slate-600">Dashboard Widget</span>
          <span className="text-slate-600">Access</span>
        </div>

        {[
          { key: "totalReceivables", label: "Total Receivables" },
          { key: "totalPayables", label: "Total Payables" },
          { key: "pendingBills", label: "Pending Bills" },
          { key: "clearedBills", label: "Cleared Bills" },
          { key: "incomeExpenseChart", label: "Monthly Income vs Expense Chart" },
          { key: "incomeValues", label: "Income Values" },
          { key: "expenseValues", label: "Expense Values" },
          { key: "outstandingTrends", label: "Outstanding Trends" },
          { key: "upcomingDueDates", label: "Upcoming Due Dates" },
        ].map((row) => (
          <div
            key={row.key}
            className="flex items-center justify-between px-4 py-4 border-t"
          >
            <span className="text-sm font-semibold text-slate-700">
              {row.label}
            </span>

            <input
              type="checkbox"
              checked={local.widgets[row.key] !== false}
              onChange={() => toggle(row.key)}
              className="w-6 h-6 cursor-pointer"
              style={{ accentColor: "#059669" }}
            />
          </div>
        ))}
      </div>

      {/* CONFIRM MODAL */}
      {showConfirm && (
        <div
          className="fixed inset-0 z-50 bg-black/50
                     flex items-center justify-center"
        >
          <div className="bg-white rounded-xl p-6 w-96 shadow-2xl">
            <div className="text-center">
              <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto" />
              <h3 className="mt-4 text-sm font-black uppercase">
                Confirm Changes?
              </h3>
              <p className="mt-2 text-xs text-slate-500">
                Are you sure you want to update dashboard permissions for{" "}
                <b>{user?.name}</b>?
              </p>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                style={{
                  backgroundColor: "#ffffff",
                  color: "#475569",
                  border: "1px solid #cbd5e1",
                }}
                className="flex-1 py-2 rounded-lg
                           text-xs font-bold uppercase"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={confirmSave}
                style={{ backgroundColor: "#059669", color: "#ffffff" }}
                className="flex-1 py-2 rounded-lg
                           text-xs font-bold uppercase"
              >
                Yes, Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
