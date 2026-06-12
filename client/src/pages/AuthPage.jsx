import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import Button from '../components/ui/Button.jsx';
import Input from '../components/ui/Input.jsx';
import PageTransition from '../components/ui/PageTransition.jsx';
import Navbar from '../components/layout/Navbar.jsx';
import { useAuth } from '../context/AuthContext.jsx';

// Custom Google Icon Component
const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    <path d="M1 1h22v22H1z" fill="none"/>
  </svg>
);

export default function AuthPage({ mode }) {
  const isLogin = mode === 'login';
  const navigate = useNavigate();
  const { login, register, loginWithGoogle } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await login({ email: form.email, password: form.password });
        navigate('/app/dashboard');
      } else {
        await register(form);
        // Supabase might require email verification, handle UI accordingly
        setError('Account created! Please check your email to verify before logging in, or you may be logged in automatically.');
        setTimeout(() => navigate('/app/dashboard'), 2000);
      }
    } catch (err) {
      setError(err.message || 'An error occurred during authentication.');
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleLogin() {
    setError('');
    setGoogleLoading(true);
    try {
      await loginWithGoogle();
      // OAuth redirects, so we don't navigate here manually
    } catch (err) {
      setError(err.message || 'Failed to authenticate with Google.');
      setGoogleLoading(false);
    }
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-paper text-ink relative flex flex-col">
        <Navbar />

        <div className="flex-1 flex pt-28 pb-12">
          <div className="mx-auto w-full max-w-6xl px-4 flex flex-col lg:flex-row gap-12 items-center justify-center">
            
            {/* Left/Top Content Area */}
            <section className="w-full lg:w-1/2 flex flex-col justify-center text-center lg:text-left animate-fade-up">
              <div className="mx-auto lg:mx-0 mb-6 inline-flex items-center gap-2 rounded-full border border-brandBlue/20 bg-brandBlue/5 px-4 py-1.5 text-xs font-bold text-brandBlue">
                <ShieldCheck size={16} />
                Secure authentication
              </div>
              <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight">
                Your workspace for <br/>
                <span className="text-brandBlue">smarter legal review.</span>
              </h1>
              <p className="mt-6 text-lg text-slate-600 max-w-lg mx-auto lg:mx-0">
                Join LegalEase AI to securely upload, analyze, and manage your contracts in one centralized dashboard.
              </p>
            </section>

            {/* Auth Form Card */}
            <section className="w-full lg:w-1/2 max-w-md animate-fade-up" style={{ animationDelay: '0.1s' }}>
              <div className="rounded-2xl border border-line bg-white/80 backdrop-blur-xl p-8 shadow-float relative overflow-hidden">
                {/* Decorative background glow inside card */}
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-brandBlue/10 rounded-full blur-[60px] pointer-events-none"></div>

                <div className="relative z-10">
                  <h2 className="font-display text-3xl font-bold">{isLogin ? 'Welcome back' : 'Create an account'}</h2>
                  <p className="mt-2 text-sm text-slate-500">
                    {isLogin ? 'Sign in to access your analysis history.' : 'Start your secure document intelligence journey.'}
                  </p>

                  <div className="mt-8 space-y-4">
                    <button 
                      onClick={handleGoogleLogin}
                      disabled={googleLoading || loading}
                      className="w-full bg-white border border-line text-ink hover:bg-slate-50 transition-all duration-300 px-5 py-3 rounded-xl font-bold flex justify-center items-center gap-3 shadow-sm hover:shadow hover:-translate-y-0.5 disabled:opacity-70"
                    >
                      <GoogleIcon />
                      {googleLoading ? 'Connecting...' : `Continue with Google`}
                    </button>

                    <div className="relative flex items-center py-2">
                      <div className="flex-grow border-t border-line"></div>
                      <span className="flex-shrink-0 mx-4 text-xs font-medium text-slate-400 uppercase tracking-wider">Or continue with email</span>
                      <div className="flex-grow border-t border-line"></div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                      {!isLogin && (
                        <Input
                          label="Full name"
                          value={form.name}
                          onChange={(event) => setForm({ ...form, name: event.target.value })}
                          placeholder="Alex Morgan"
                          required
                        />
                      )}
                      <Input
                        label="Work email"
                        type="email"
                        value={form.email}
                        onChange={(event) => setForm({ ...form, email: event.target.value })}
                        placeholder="you@company.com"
                        required
                      />
                      <Input
                        label="Password"
                        type="password"
                        value={form.password}
                        onChange={(event) => setForm({ ...form, password: event.target.value })}
                        placeholder="At least 8 characters"
                        required
                      />
                      {error && (
                        <p className={`rounded-lg px-3 py-2 text-sm font-semibold ${error.includes('Account created') ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                          {error}
                        </p>
                      )}
                      
                      <button 
                        type="submit" 
                        disabled={loading || googleLoading}
                        className="w-full bg-brandBlue text-white hover:bg-blue-700 transition-all duration-300 px-5 py-3 rounded-xl font-bold flex justify-center items-center shadow-glow hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-70"
                      >
                        {loading ? 'Processing...' : isLogin ? 'Sign in' : 'Create account'}
                      </button>
                    </form>
                  </div>

                  <p className="mt-8 text-center text-sm font-medium text-slate-600">
                    {isLogin ? 'New to LegalEase AI?' : 'Already have an account?'}{' '}
                    <Link to={isLogin ? '/register' : '/login'} className="text-brandBlue hover:text-blue-800 transition-colors">
                      {isLogin ? 'Create account' : 'Sign in'}
                    </Link>
                  </p>
                </div>
              </div>
            </section>

          </div>
        </div>
      </div>
    </PageTransition>
  );
}
