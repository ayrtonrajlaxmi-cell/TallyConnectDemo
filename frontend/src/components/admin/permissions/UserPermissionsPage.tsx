import {
  ArrowLeft,
  BookOpen,
  FileText,
  Package,
  ShoppingCart,
  Wallet,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import { useState } from "react";
import { LedgerPermissions } from "./LedgerPermissions";
import { OrderBookPermissions } from "./OrderBookPermissions"; // ✅ ADD

export function UserPermissionsPage({ user, onBack, onSave }: any) {
  const [activeModule, setActiveModule] = useState("ledgers");

  /* ================= PERMISSIONS STATE ================= */
  const [draftPermissions, setDraftPermissions] = useState({
    ledgers: {
      enabled: true,
      columns: {
        partyName: true,
        type: true,
        opening: true,
        outstanding: true,
        dueDays: true,
        actions: true,
      },
    },
    orders: {
      enabled: true,
      columns: {
        orderNo: true,
        type: true,
        date: true,
        party: true,
        amount: true,
        dueDate: true,
        status: true,
      },
    },
    inventory: true,
    vouchers: true,
    monthlySummary: true,
  });

  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingModule, setPendingModule] = useState<string | null>(null);

  /* ================= MODULE ENABLE / DISABLE ================= */
  const handleModuleToggle = (key: string, enabled: boolean) => {
    if (enabled) {
      setPendingModule(key);
      setShowConfirm(true);
      return;
    }

    if (key === "ledgers" || key === "orders") {
      setDraftPermissions({
        ...draftPermissions,
        [key]: { ...(draftPermissions as any)[key], enabled: true },
      });
    } else {
      setDraftPermissions({
        ...draftPermissions,
        [key]: true,
      });
    }
  };

  const confirmRevoke = () => {
    if (!pendingModule) return;

    if (pendingModule === "ledgers" || pendingModule === "orders") {
      setDraftPermissions({
        ...draftPermissions,
        [pendingModule]: {
          ...(draftPermissions as any)[pendingModule],
          enabled: false,
        },
      });
    } else {
      setDraftPermissions({
        ...draftPermissions,
        [pendingModule]: false,
      });
    }

    setShowConfirm(false);
    setPendingModule(null);
  };

  /* ================= UI ================= */
  return (
    <div className="max-w-7xl mx-auto space-y-6 p-4">
      {/* ================= CONFIRM MODAL ================= */}
      {showConfirm && (
        <div className="fixed inset-0 z-[999] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-white rounded-xl p-8 max-w-sm w-full border shadow-2xl">
            <div className="text-center">
              <AlertTriangle className="w-10 h-10 text-red-500 mx-auto" />
              <h3 className="mt-4 text-sm font-black uppercase">
                Revoke Access?
              </h3>
              <p className="text-xs text-slate-500 mt-2">
                {user.company} will lose access to{" "}
                <b className="uppercase">{pendingModule}</b>
              </p>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-2 text-xs font-bold text-slate-400 uppercase"
              >
                Cancel
              </button>
              <button
                onClick={confirmRevoke}
                className="flex-1 py-2 text-xs font-bold uppercase bg-red-600 text-white rounded-lg"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= BACK ================= */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Users
      </button>

      {/* ================= USER BAR ================= */}
      <div className="bg-white rounded-xl border p-6 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black">{user.name}</h2>
          <span className="px-2 py-1 bg-blue-50 text-blue-600 text-[10px] font-black uppercase rounded">
            {user.company}
          </span>
        </div>

        <button
          onClick={() => onSave?.(draftPermissions)}
          className="flex items-center gap-2 px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-black text-[10px] uppercase shadow"
        >
          <CheckCircle className="w-4 h-4" />
          Save User Permissions
        </button>
      </div>

      {/* ================= MAIN ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ================= LEFT ================= */}
        <div className="bg-white rounded-xl border p-4 space-y-2">
          {[
            { key: "ledgers", label: "Ledger", icon: BookOpen },
            { key: "orders", label: "Order Book", icon: ShoppingCart },
            { key: "inventory", label: "Inventory", icon: Package },
            { key: "vouchers", label: "Vouchers", icon: FileText },
            { key: "monthlySummary", label: "Summary", icon: Wallet },
          ].map((m) => {
            const enabled =
              m.key === "ledgers" || m.key === "orders"
                ? (draftPermissions as any)[m.key].enabled
                : (draftPermissions as any)[m.key];

            return (
              <div
                key={m.key}
                onClick={() => setActiveModule(m.key)}
                className={`flex items-center justify-between p-4 rounded-lg border-2 cursor-pointer ${
                  activeModule === m.key
                    ? "bg-blue-50 border-blue-500"
                    : "border-transparent"
                }`}
              >
                <div className="flex items-center gap-3">
                  <m.icon className="w-5 h-5 text-blue-600" />
                  <span className="font-bold">{m.label}</span>
                </div>

                <input
                  type="checkbox"
                  checked={enabled}
                  onClick={(e) => e.stopPropagation()}
                  onChange={() => handleModuleToggle(m.key, enabled)}
                  className="w-5 h-5 accent-black"
                />
              </div>
            );
          })}
        </div>

        {/* ================= RIGHT ================= */}
        <div className="lg:col-span-2 bg-white rounded-xl border overflow-hidden">
          <div className="bg-slate-50 border-b p-4">
            <h3 className="text-[10px] font-black uppercase">
              {activeModule} Permissions
            </h3>
          </div>

          {activeModule === "ledgers" && (
            <LedgerPermissions
              value={draftPermissions.ledgers}
              user={user}
              onChange={(updated) =>
                setDraftPermissions({
                  ...draftPermissions,
                  ledgers: updated,
                })
              }
              onDone={onBack}
            />
          )}

          {activeModule === "orders" && (
            <OrderBookPermissions
              value={draftPermissions.orders}
              user={user}
              onChange={(updated) =>
                setDraftPermissions({
                  ...draftPermissions,
                  orders: updated,
                })
              }
              onDone={onBack}
            />
          )}
        </div>
      </div>
    </div>
  );
}