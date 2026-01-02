import { useState, useEffect } from "react";
import { User, Building2, Bell, LogOut } from "lucide-react";
import { API_URL } from "../config/api";

interface SettingsPageProps {
  user: { username: string; company: string };
  onLogout: () => void;
}

export function SettingsPage({ user, onLogout }: SettingsPageProps) {
  const [activeTab, setActiveTab] = useState<"profile" | "notifications">(
    "profile"
  );

  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
const [role, setRole] = useState<string>("");

  const tabs = [
    { id: "profile", label: "Profile", icon: User },
    { id: "notifications", label: "Notifications", icon: Bell },
  ];

  /* ================= FETCH USER PROFILE ================= */
  useEffect(() => {
  const token = localStorage.getItem("token");

  fetch("${API_URL}/users/me", {
    headers: { Authorization: `Bearer ${token}` },
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.avatar_url) {
        setAvatarUrl(data.avatar_url);
      }
      if (data.role) {
        setRole(data.role);
      }
    });
}, []);


  /* ================= AVATAR UPLOAD ================= */
  const uploadAvatar = async (file: File) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const formData = new FormData();
    formData.append("avatar", file);

    const res = await fetch("${API_URL}/users/me/avatar", {

      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!res.ok) {
      alert("Avatar upload failed");
      return;
    }

    const data = await res.json();

    if (data.avatar_url) {
      setAvatarUrl(data.avatar_url);
      setAvatarPreview(null);
    }
  };

  const handleAvatarChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select a valid image file");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      alert("Image must be less than 2MB");
      return;
    }

    // Preview instantly
    const reader = new FileReader();
    reader.onload = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload to backend
    await uploadAvatar(file);
  };

  /* ================= SAVE PROFILE ================= */
  const handleSaveProfile = async () => {
    const token = localStorage.getItem("token");
    const inputs = document.querySelectorAll("input");
    const select = document.querySelector("select") as HTMLSelectElement;

    const payload = {
      username: inputs[0]?.value,
      email: inputs[1]?.value,
      company: inputs[2]?.value,
    };

    await fetch("${API_URL}/users/me", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    alert("Profile saved");
  };

  /* ================= NOTIFICATIONS ================= */
  useEffect(() => {
    const token = localStorage.getItem("token");

    fetch("${API_URL}/users/me/notifications", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        const checkboxes = document.querySelectorAll(
          'input[type="checkbox"][data-key]'
        );

        checkboxes.forEach((cb: any) => {
          cb.checked = Boolean(data[cb.dataset.key]);
        });
      });
  }, []);

  const handleSaveNotifications = async () => {
    const token = localStorage.getItem("token");

    const checkboxes = document.querySelectorAll(
      'input[type="checkbox"][data-key]'
    );

    const preferences: any = {};

    checkboxes.forEach((cb: any) => {
      preferences[cb.dataset.key] = cb.checked;
    });

    await fetch("${API_URL}/users/me/notifications", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(preferences),
    });

    alert("Notification preferences saved");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl text-gray-900 dark:text-white">
          Settings
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Manage your account settings and preferences
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <nav className="space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                      activeTab === tab.id
                        ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}

              <button
                onClick={onLogout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span>Logout</span>
              </button>
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            {/* PROFILE */}
            {activeTab === "profile" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl text-gray-900 dark:text-white mb-4">
                    Profile Information
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Update your account profile information
                  </p>
                </div>

                {/* AVATAR */}
                <div className="flex items-center gap-6 pb-6 border-b border-gray-200 dark:border-gray-700">
                 {avatarPreview ? (
  <img
    src={avatarPreview}
    alt="Avatar"
    className="w-20 h-20 rounded-full object-cover border"
  />
) : avatarUrl ? (
  <img
  src={`${API_URL}${avatarUrl}`}
  alt="Avatar"
  className="w-20 h-20 rounded-full object-cover border"
/>

) : (
  <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-3xl">
    {user.username.charAt(0).toUpperCase()}
  </div>
)}


                  <div>
                    <label className="inline-block">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarChange}
                        className="hidden"
                      />
                      <span className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm cursor-pointer">
                        Change Avatar
                      </span>
                    </label>

                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      JPG, PNG or GIF. Max size 2MB
                    </p>
                  </div>
                </div>

                {/* FORM */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm mb-2">
                      Username
                    </label>
                    <input
                      type="text"
                      defaultValue={user.username}
                      className="w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700"
                    />
                  </div>

                  <div>
                    <label className="block text-sm mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      defaultValue={`${user.username}@gmail.com`}
                      className="w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700"
                    />
                  </div>

                  

<div>
  <label className="block text-sm mb-2">Role</label>

  <select
    value={role}
    disabled
    className="w-full px-4 py-2 border rounded-lg bg-gray-100 dark:bg-gray-700 cursor-not-allowed"
  >
    <option value={role}>{role}</option>
  </select>

  <p className="text-xs text-gray-500 mt-1">
    Role is assigned by administrator
  </p>
</div>

                </div>

                <div className="pt-4 border-t">
<button
  onClick={handleSaveProfile}
  className="px-6 py-2 bg-blue-600 text-white rounded-lg"
>
                    Save Changes
                  </button>
                </div>
              </div>
            )}

            {/* NOTIFICATIONS */}
            {activeTab === "notifications" && (
              <div className="space-y-6">
                <h2 className="text-xl">Notification Preferences</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Manage how you receive notifications
                </p>

                <div className="space-y-4">
                  {[
  { label: "Payment Due Reminders", key: "payment_due" },
  { label: "Low Stock Alerts", key: "low_stock" },
  { label: "New Voucher Created", key: "new_voucher" },
  { label: "Monthly Reports", key: "monthly_reports" },
].map(item => (
  <div
    key={item.key}
    className="flex justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
  >
    <p className="text-sm">{item.label}</p>
    <input type="checkbox" data-key={item.key} />
  </div>
))}

                </div>

                <div className="pt-4 border-t">
                  <button
  onClick={handleSaveNotifications}
  className="px-6 py-2 bg-blue-600 text-white rounded-lg"
>
  Save Preferences
</button>

                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
