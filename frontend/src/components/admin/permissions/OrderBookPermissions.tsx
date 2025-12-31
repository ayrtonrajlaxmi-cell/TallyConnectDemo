import { useEffect, useState } from "react";
import { Save, AlertTriangle } from "lucide-react";

const ALL_COLUMNS = {
  orderNo: true,
  partyName: true,
  date: true,
  amount: true,
  status: true,
  actions: true,
};

export function OrderBookPermissions({
  value,
  user,
  onChange,
  onDone,
  refreshCurrentUser,
}: any) {
  const [local, setLocal] = useState({
    columns: {
      ...ALL_COLUMNS,
      ...(value?.columns || {}),
    },
  });

  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    setLocal({
      columns: {
        ...ALL_COLUMNS,
        ...(value?.columns || {}),
      },
    });
  }, [value]);

  const toggle = (key: string) => {
    setLocal((prev: any) => ({
      ...prev,
      columns: {
        ...prev.columns,
        [key]: !prev.columns[key],
      },
    }));
  };

  const save = () => setShowConfirm(true);

  const confirmSave = async () => {
    try {
      const res = await fetch(
        `http://localhost:4000/users/${user.id}/orders-permissions`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify(local),
        }
      );

      if (!res.ok) throw new Error("Failed to save order permissions");

      onChange?.(local);
      await refreshCurrentUser();
      setShowConfirm(false);
      onDone?.();
    } catch (err) {
      console.error(err);
      alert("Failed to save order permissions");
    }
  };


  return (
    <div className="p-6 space-y-6 w-full bg-white">
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h2 className="text-lg font-black uppercase text-slate-900">
            Order Book Permissions
          </h2>
          <p className="text-xs text-slate-500">
            {user?.name} · {user?.company}
          </p>
        </div>

        <button
          type="button"
          onClick={save}
          style={{ backgroundColor: "#059669", color: "#ffffff" }}
          className="flex items-center gap-2 px-6 py-2 rounded-lg
                     text-xs font-black uppercase shadow"
        >
          <Save size={16} color="#ffffff" />
          Save
        </button>
      </div>

      <div className="border border-slate-200 rounded-xl overflow-hidden">
        <div className="flex justify-between px-4 py-3 bg-slate-50 text-xs font-black uppercase border-b">
          <span className="text-slate-600">Field</span>
          <span className="text-slate-600">Access</span>
        </div>

        {[
          { key: "orderNo", label: "Order No" },
          { key: "partyName", label: "Party Name" },
          { key: "date", label: "Date" },
          { key: "amount", label: "Amount" },
          { key: "status", label: "Status" },
          { key: "actions", label: "Actions" },
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
              checked={!!local.columns[row.key]}

              onChange={() => toggle(row.key)}
              className="w-6 h-6 cursor-pointer"
              style={{ accentColor: "#059669" }}
            />
          </div>
        ))}
      </div>

      {showConfirm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
          <div className="bg-white rounded-xl p-6 w-96 shadow-2xl">
            <div className="text-center">
              <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto" />
              <h3 className="mt-4 text-sm font-black uppercase">
                Confirm Changes?
              </h3>
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