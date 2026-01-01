import { useState } from 'react';
import { Building2, Lock, User, Mail } from 'lucide-react';
import { API_URL } from "../config/api";

interface LoginPageProps {
  onLogin: (data: { user: any }) => void;
}


export function LoginPage({ onLogin }: LoginPageProps) {
  const [isRegister, setIsRegister] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // ----------------------
  // REGISTER (unchanged logic)
  // ----------------------
  const registerUser = async (
    username: string,
    email: string,
    password: string,
    isAdmin: boolean
  ) => {
    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password, isAdmin }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      alert(data.message);
      setIsRegister(false);
      setIsAdmin(false);
    } catch (err: any) {
      alert(err.message);
    }
  };

  // ----------------------
  // LOGIN (FIXED)
  // ----------------------
  const loginUser = async (username: string, password: string) => {
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
  username,
  password,
  loginType: isAdmin ? "ADMIN" : "USER",
}), // 🔥
      });

    const data = await res.json();
if (!res.ok) throw new Error(data.message);

alert(`Welcome ${data.user.username}`);
localStorage.setItem("token", data.token);

// 🔑 Pass ONLY user object
onLogin({
  user: data.user,
  token: data.token,
});

    } catch (err: any) {
      alert(err.message);
    }
  };

  // ----------------------
  // Form submit handler
  // ----------------------
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isRegister) {
      await registerUser(username, email, password, isAdmin);
    } else {
      await loginUser(username, password);
    }
  };


  // ----------------------
  // Render: Login/Register form
  // ----------------------
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center">
        {/* Left side illustration */}
        <div className="hidden lg:flex flex-col items-center justify-center p-12 bg-gradient-to-br from-blue-600 to-blue-800 rounded-3xl shadow-2xl">
          <div className="text-white text-center">
            <div className="mb-8 flex justify-center">
              <div className="p-6 bg-white/10 backdrop-blur-sm rounded-2xl">
                <Building2 className="w-24 h-24" />
              </div>
            </div>
            <h1 className="text-4xl mb-4">Tally Connect</h1>
            <p className="text-blue-100 text-lg">Access your accounting data anywhere, anytime</p>
          </div>
        </div>

        {/* Right side - form */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-blue-600 rounded-xl">
                <Building2 className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-2xl text-gray-900">
                  {isRegister ? 'Create Account' : isAdmin ? 'Admin Login' : 'User Login'}
                </h2>
                <p className="text-gray-500">
                  {isRegister
                    ? 'Sign up for a new account'
                    : isAdmin
                    ? 'Sign in with your admin credentials'
                    : 'Sign in to your account'}
                </p>
              </div>
            </div>
          </div>

          {/* Admin/User toggle */}
          {!isRegister && (
            <div className="mb-4 flex justify-center gap-4 text-sm">
              <button
                type="button"
                onClick={() => setIsAdmin(false)}
                className={`py-2 px-4 rounded-xl ${!isAdmin ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
              >
                User
              </button>
              <button
                type="button"
                onClick={() => setIsAdmin(true)}
                className={`py-2 px-4 rounded-xl ${isAdmin ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
              >
                Admin
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="username" className="block text-sm text-gray-700 mb-2">Username</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your username"
                  required
                />
              </div>
            </div>

            {isRegister && (
              <div>
                <label htmlFor="email" className="block text-sm text-gray-700 mb-2">Email</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your email"
                    required
                  />
                </div>
              </div>
            )}

            <div>
              <label htmlFor="password" className="block text-sm text-gray-700 mb-2">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your password"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700 transition-colors"
            >
              {isRegister ? (isAdmin ? 'Register Admin' : 'Register User') : isAdmin ? 'Admin Login' : 'User Login'}
            </button>
          </form>

          <div className="mt-8 text-center text-sm text-gray-500">
            {isRegister ? (
              <p>
                Already have an account?{' '}
                <button onClick={() => { setIsRegister(false); setIsAdmin(false); }} className="text-blue-600 hover:text-blue-700">
                  Sign In
                </button>
              </p>
            ) : (
              <p>
                Don't have an account?{' '}
                <button onClick={() => setIsRegister(true)} className="text-blue-600 hover:text-blue-700">
                  Register
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
