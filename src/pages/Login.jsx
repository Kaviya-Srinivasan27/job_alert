import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { Mail, Lock, LogIn, UserPlus } from 'lucide-react';

const ADMIN_EMAIL = 'kavisri@gmail.com'; // <-- Unga admin email

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  // ✨ PUDHUSA ADD PANNADHU: Remember Me State ✨
  const [rememberMe, setRememberMe] = useState(false);

  useEffect(() => {
    // 1. Page load aagumbothu saved email irukka nu check panrom
    const savedEmail = localStorage.getItem('jobalert_email');
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }

    // 2. Already login aagirukkangala nu check panrom
    const checkSession = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        if (user.email === ADMIN_EMAIL) {
          window.location.href = '/admin'; 
        } else {
          window.location.href = '/student'; 
        }
      }
    };
    checkSession();
  }, []);

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (isLogin) {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
        alert("Login Failed: " + error.message);
      } else {
        // ✨ REMEMBER ME LOGIC ✨
        if (rememberMe) {
          localStorage.setItem('jobalert_email', email); // Email-a save panrom
        } else {
          localStorage.removeItem('jobalert_email'); // Tick illana remove pandrom
        }

        if (data.user.email === ADMIN_EMAIL) {
          window.location.href = '/admin'; 
        } else {
          window.location.href = '/student'; 
        }
      }

    } else {
      if (email === ADMIN_EMAIL) {
        alert("This email is reserved for Admin. Please use a different email for student account.");
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.auth.signUp({ email, password });
      
      if (error) {
        alert("Registration Failed: " + error.message);
      } else if (data?.user) {
        await supabase.from('users').insert([
          { id: data.user.id, email: email, name: email.split('@')[0] }
        ]);
        alert("Account Created Successfully! 🎉 Now please login.");
        
        setIsLogin(true);
        setPassword('');
        // Email appidiye irukkattum, user direct-a login panna vasadhiya irukkum
      }
    }
    setLoading(false);
  };

  const handleToggleMode = () => {
    setIsLogin(!isLogin);
    // Login-ku maarumpothu saved email irundha theliva kaattuvom
    if (!isLogin && rememberMe) {
      const savedEmail = localStorage.getItem('jobalert_email');
      setEmail(savedEmail || '');
    } else {
      setEmail('');     
    }
    setPassword('');  
  };

  return (
    <div className="flex items-center justify-center h-screen bg-slate-100 font-sans">
      <div className="bg-white p-10 rounded-3xl shadow-xl w-full max-w-md animate-in zoom-in-95 duration-300">
        
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-blue-600 mb-2">JobAlert.tn</h1>
          <p className="text-slate-500 font-medium">
            {isLogin ? 'Welcome back! Please login.' : 'Create your student account.'}
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3.5 text-slate-400" size={20} />
              <input 
                type="email" 
                required 
                autoComplete="email" // ✨ BROWSER AUTO-FILL ✨
                className="w-full pl-10 p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3.5 text-slate-400" size={20} />
              <input 
                type="password" 
                required 
                autoComplete={isLogin ? "current-password" : "new-password"} // ✨ BROWSER AUTO-FILL ✨
                className="w-full pl-10 p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {/* ✨ REMEMBER ME CHECKBOX ✨ */}
          {isLogin && (
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm font-medium text-slate-600 cursor-pointer hover:text-slate-800 transition">
                <input 
                  type="checkbox" 
                  checked={rememberMe} 
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-slate-50 border-slate-300 rounded focus:ring-blue-500 cursor-pointer" 
                />
                Remember my email
              </label>
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white p-4 rounded-xl font-bold hover:bg-blue-700 transition disabled:opacity-70 mt-2"
          >
            {loading ? 'Processing...' : (isLogin ? <><LogIn size={20}/> Login</> : <><UserPlus size={20}/> Create Account</>)}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button 
            type="button" 
            onClick={handleToggleMode}
            className="text-sm font-bold text-slate-500 hover:text-blue-600 transition px-3 py-1.5 rounded-lg outline-none focus:outline-none focus:bg-slate-50"
          >
            {isLogin ? "Don't have an account? Sign up" : "Already have an account? Login"}
          </button>
        </div>

      </div>
    </div>
  );
}