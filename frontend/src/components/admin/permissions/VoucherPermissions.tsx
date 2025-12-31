import { useEffect, useState } from "react";
import { Save, AlertTriangle } from "lucide-react";

export function VoucherPermissions({
  value,
  user,
  onChange,
  onDone,
  refreshCurrentUser,
}: any) {
const [local, setLocal] = useState({
  can_view: value?.can_view ?? true,
  columns: value?.columns || {},
});

  const [showConfirm, setShowConfirm] = useState(false);

useEffect(() => {
  setLocal({
    can_view: value?.can_view ?? true,
    columns: value?.columns || {},
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


  /* CLICK SAVE → SHOW CONFIRM */
  const save = () => {
    setShowConfirm(true);
  };

  /* CONFIRM SAVE */
const confirmSave = async () => {
  try {
    const res = await fetch(
      `http://localhost:4000/users/${user.id}/voucher-permissions`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(local), // 🔥 MISSING LINE
      }
    );

    const data = await res.json();
    console.log("Save API response:", data);

    if (!res.ok) throw new Error("Failed to save permissions");

    await refreshCurrentUser(); // correct
    setShowConfirm(false);
    onDone?.();
  } catch (err) {
    console.error("Error saving voucher permissions:", err);
    alert("Failed to save voucher permissions");
  }
};



  // 🔥 THIS IS THE KEY PART
  //await refreshCurrentUser(); // same as ledger







  return (
    <div className="p-6 space-y-6 w-full bg-white">
      {/* HEADER */}
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h2 className="text-lg font-black uppercase text-slate-900">
            Voucher Permissions
          </h2>
          <p className="text-xs text-slate-500">
            {user?.name} · {user?.company}
          </p>
        </div>
        

        {/* SAVE BUTTON */}
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

      {/* TABLE */}
      <div className="border border-slate-200 rounded-xl overflow-hidden">
        {/* MASTER ACCESS TOGGLE */}
<div className="flex items-center justify-between px-4 py-3 border-b">
  <span className="text-sm font-bold text-slate-700">
    Allow Voucher Access
  </span>
  <input
    type="checkbox"
    checked={local.can_view !== false}
    onChange={() =>
      setLocal((prev: any) => ({
        ...prev,
        can_view: !prev.can_view,
      }))
    }
    className="w-6 h-6 cursor-pointer"
  />
</div>

        <div
          className="flex justify-between px-4 py-3 bg-slate-50
                     text-xs font-black uppercase border-b"
        >
          <span className="text-slate-600">Voucher Field</span>
          <span className="text-slate-600">Access</span>
        </div>

        {[
  { key: "date", label: "Date" },
  { key: "type", label: "Voucher Type" },
  { key: "refNo", label: "Reference No." },
  { key: "party", label: "Party" },
  { key: "amount", label: "Amount" },
  { key: "status", label: "Status" },
  { key: "actions", label: "Actions" },
]
.map((row) => (
          <div
            key={row.key}
            className="flex items-center justify-between px-4 py-4 border-t"
          >
            <span className="text-sm font-semibold text-slate-700">
              {row.label}
            </span>

            <input
              type="checkbox"
              checked={local.columns[row.key] !== false}
              onChange={() => toggle(row.key)}
              className="w-6 h-6 cursor-pointer"
              style={{ accentColor: "#059669" }}
            />
          </div>
        ))}
      </div>

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
                Are you sure you want to update voucher permissions for{" "}
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