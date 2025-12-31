import { useEffect, useState } from "react";
import { Save, AlertTriangle } from "lucide-react";

export function MonthlySummaryPermissions({
  value,
  user,
  onChange,
  onDone,
}: any) {
  const [local, setLocal] = useState(
    value || {
      cards: {},
      columns: {},
      charts: {},
    }
  );

  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    if (value) setLocal(value);
  }, [value]);

  const toggle = (section: string, key: string) => {
    setLocal((prev: any) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: prev?.[section]?.[key] === false ? true : false,
      },
    }));
  };

  const save = () => setShowConfirm(true);

  const confirmSave = () => {
    onChange?.(local);
    setShowConfirm(false);
    onDone?.();
  };

  return (
    <div className="p-6 space-y-6 w-full bg-white">
      {/* HEADER */}
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h2 className="text-lg font-black uppercase text-slate-900">
            Monthly Summary Permissions
          </h2>
          <p className="text-xs text-slate-500">
            {user?.name} · {user?.company}
          </p>
        </div>

        <button
          onClick={save}
          style={{ backgroundColor: "#059669", color: "#ffffff" }}
          className="flex items-center gap-2 px-6 py-2 rounded-lg
                     text-xs font-black uppercase shadow"
        >
          <Save size={16} />
          Save
        </button>
      </div>

      {/* SUMMARY CARDS */}
      <PermissionTable
        title="Summary Cards"
        items={[
          { section: "cards", key: "turnover", label: "Total Turnover" },
          { section: "cards", key: "expense", label: "Total Expense" },
          { section: "cards", key: "profit", label: "Total Profit" },
          { section: "cards", key: "margin", label: "Profit Margin" },
        ]}
        local={local}
        toggle={toggle}
      />

      {/* TABLE COLUMNS */}
      <PermissionTable
        title="Table Columns"
        items={[
          { section: "columns", key: "month", label: "Month" },
          { section: "columns", key: "turnover", label: "Turnover" },
          { section: "columns", key: "expense", label: "Expense" },
          { section: "columns", key: "profit", label: "Profit" },
          { section: "columns", key: "margin", label: "Margin %" },
          { section: "columns", key: "action", label: "Action" },
        ]}
        local={local}
        toggle={toggle}
      />

      {/* CHARTS */}
      <PermissionTable
        title="Charts"
        items={[
          {
            section: "charts",
            key: "comparison",
            label: "Monthly Comparison",
          },
          {
            section: "charts",
            key: "profitTrend",
            label: "Profit Trend",
          },
        ]}
        local={local}
        toggle={toggle}
      />

      {/* CONFIRM MODAL */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
          <div className="bg-white rounded-xl p-6 w-96 shadow-2xl">
            <div className="text-center">
              <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto" />
              <h3 className="mt-4 text-sm font-black uppercase">
                Confirm Changes?
              </h3>
              <p className="mt-2 text-xs text-slate-500">
                Update monthly summary permissions for{" "}
                <b>{user?.name}</b>?
              </p>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-2 rounded-lg text-xs font-bold uppercase border"
              >
                Cancel
              </button>

              <button
                onClick={confirmSave}
                style={{ backgroundColor: "#059669", color: "#ffffff" }}
                className="flex-1 py-2 rounded-lg text-xs font-bold uppercase"
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

/* ================= REUSABLE TABLE ================= */

function PermissionTable({ title, items, local, toggle }: any) {
  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      <div className="flex justify-between px-4 py-3 bg-slate-50 text-xs font-black uppercase border-b">
        <span className="text-slate-600">{title}</span>
        <span className="text-slate-600">Access</span>
      </div>

      {items.map((row: any) => (
        <div
          key={row.key}
          className="flex items-center justify-between px-4 py-4 border-t"
        >
          <span className="text-sm font-semibold text-slate-700">
            {row.label}
          </span>

          <input
            type="checkbox"
            checked={local?.[row.section]?.[row.key] !== false}
            onChange={() => toggle(row.section, row.key)}
            className="w-6 h-6 cursor-pointer"
            style={{ accentColor: "#059669" }}
          />
        </div>
      ))}
    </div>
  );
}