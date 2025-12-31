import { useState } from "react";
import { LoginPage } from "./components/LoginPage";
import { DashboardLayout } from "./components/DashboardLayout";

type User = {
  id: number;
  username: string;
  role: "ADMIN" | "USER";
  ledgerPermissions?: {
    columns: Record<string, boolean>;
  };
};


export default function App() {
  const [user, setUser] = useState<User | null>(null);

  // 🔑 FIXED: receive full login payload
  const handleLogin = (data: { user: User }) => {
  setUser(data.user);
};


  const handleLogout = () => {
    setUser(null);
  };

  if (!user) {
    return <LoginPage onLogin={handleLogin} />;
  }

 return (
  <DashboardLayout
    user={user}
    onLogout={handleLogout}
  />
);

}
