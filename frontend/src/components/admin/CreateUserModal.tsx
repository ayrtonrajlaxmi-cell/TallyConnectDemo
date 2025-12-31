import { X, Save, UserPlus, Mail, Building2, User, Shield } from "lucide-react";
import { useState } from "react";

interface Props {
  onClose: () => void;
  onCreate: (user: {
    name: string;
    email: string;
    company: string;
    password: string;
  }) => void;
}

export function CreateUserModal({ onClose, onCreate }: Props) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    company: "",
    password: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.name || !form.email || !form.company || !form.password) return;

    onCreate(form);
    onClose();
  };

  const handleCreateUser = async (data: {
    name: string;
    email: string;
    company: string;
    password: string;
  }) => {
    try {
      const res = await fetch("http://localhost:4000/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.message);

      // Update UI using backend response
      const newUser: User = {
        id: result.user.id,
        name: data.name,
        email: data.email,
        company: data.company,
        permissions: {
          ledgers: true,
          monthlySummary: true,
          orders: true,
          vouchers: true,
          inventory: true,
          voucherAmount: true,
        },
      };

      setUsers([...users, newUser]);
      setShowCreate(false);
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
        {/* HEADER */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-100">
              <UserPlus className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-800">
                Create New User
              </h2>
              <p className="text-xs text-slate-500">
                Add system access credentials
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            type="button"
            className="p-2 rounded-lg text-slate-500 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* FORM (BODY + FOOTER INSIDE) */}
        <form
          onSubmit={handleSubmit}
          className="flex flex-col flex-1 overflow-hidden"
        >
          {/* BODY */}
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
            <Input
              label="Full Name"
              icon={<User className="w-4 h-4" />}
              placeholder="Employee name"
              value={form.name}
              onChange={(v) => setForm({ ...form, name: v })}
            />

            <Input
              label="Email Address"
              icon={<Mail className="w-4 h-4" />}
              placeholder="name@company.com"
              type="email"
              value={form.email}
              onChange={(v) => setForm({ ...form, email: v })}
            />

            <Input
              label="Company"
              icon={<Building2 className="w-4 h-4" />}
              placeholder="Company name"
              value={form.company}
              onChange={(v) => setForm({ ...form, company: v })}
            />

            <Input
              label="Temporary Password"
              icon={<Shield className="w-4 h-4" />}
              placeholder="••••••••"
              type="password"
              value={form.password}
              onChange={(v) => setForm({ ...form, password: v })}
            />
          </div>

          {/* FOOTER */}
          <div className="px-6 py-4 border-t border-slate-200 flex gap-3">
            <button
              type="submit"
              style={{ backgroundColor: "#059669", color: "#ffffff" }}
              // Changed py-2.5 to py-1, px-3 for smaller height
              // Changed rounded-lg to rounded-none for sharp corners
              className="px-3 py-1 rounded-none text-[10px] font-bold shadow-md active:scale-95"
            >
              <span className="flex items-center justify-center gap-1">
                <Save className="w-3 h-3" />
                Create
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* CLEAN INPUT COMPONENT */
function Input({
  label,
  icon,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  icon: React.ReactNode;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  type?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-600 mb-1">
        {label}
      </label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
          {icon}
        </span>
        <input
          type={type}
          value={value}
          required
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-sm text-slate-900 focus:bg-white focus:border-slate-300 outline-none"
        />
      </div>
    </div>
  );
}
