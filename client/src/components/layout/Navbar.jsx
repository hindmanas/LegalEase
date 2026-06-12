import { Link, useLocation } from 'react-router-dom';
import { Scale, Menu, LogOut, LayoutDashboard, Settings, FileUp } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();

  const isAppRoute = location.pathname.startsWith('/app');

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <div className="fixed top-4 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none">
        <header className={`pointer-events-auto transition-all duration-300 ease-in-out glass-pill px-5 py-3 flex items-center justify-between w-full max-w-5xl ${isScrolled ? 'shadow-lg bg-white/80' : 'bg-white/60'}`}>
          <Link to={user ? "/app/dashboard" : "/"} className="flex items-center gap-3 group">
            <div className="grid size-9 place-items-center rounded-lg bg-brandBlue text-white shadow-glow transition-transform group-hover:scale-105">
              <Scale size={18} />
            </div>
            <span className="font-display text-lg font-bold tracking-tight">LegalEase AI</span>
          </Link>
          
          <nav className="hidden items-center gap-8 text-sm font-semibold text-slate-600 md:flex">
            {!user ? (
              <>
                <a href="/#features" className="hover:text-brandBlue transition-colors">Features</a>
                <a href="/#workflow" className="hover:text-brandBlue transition-colors">How it works</a>
                <a href="/#pricing" className="hover:text-brandBlue transition-colors">Pricing</a>
              </>
            ) : (
              <>
                <Link to="/app/dashboard" className={`hover:text-brandBlue transition-colors ${location.pathname === '/app/dashboard' ? 'text-brandBlue' : ''}`}>Dashboard</Link>
                <Link to="/app/upload" className={`hover:text-brandBlue transition-colors ${location.pathname === '/app/upload' ? 'text-brandBlue' : ''}`}>Upload</Link>
                <Link to="/app/settings" className={`hover:text-brandBlue transition-colors ${location.pathname === '/app/settings' ? 'text-brandBlue' : ''}`}>Settings</Link>
              </>
            )}
          </nav>
          
          <div className="hidden items-center gap-4 md:flex">
            {!user ? (
              <>
                <Link to="/login" className="text-sm font-semibold text-slate-600 transition hover:text-brandBlue">
                  Sign in
                </Link>
                <Link to="/register">
                  <button className="bg-ink text-white hover:bg-slateink transition-all duration-300 px-5 py-2.5 rounded-full text-sm font-semibold flex items-center gap-2 shadow-sm hover:shadow-md hover:-translate-y-0.5">
                    Get started
                  </button>
                </Link>
              </>
            ) : (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="grid size-8 place-items-center rounded-full bg-brandBlue/10 text-xs font-bold text-brandBlue">
                    {user?.name?.slice(0, 1)?.toUpperCase() || 'U'}
                  </div>
                  <span className="text-sm font-bold text-ink">{user?.name}</span>
                </div>
                <button onClick={logout} className="text-slate-500 hover:text-ink transition-colors p-2" title="Sign out">
                  <LogOut size={18} />
                </button>
              </div>
            )}
          </div>

          <button 
            className="md:hidden text-ink p-2 rounded-full hover:bg-black/5 transition"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <Menu size={24} />
          </button>
        </header>
      </div>

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-white/95 backdrop-blur-md pt-24 px-6 md:hidden animate-fade-in flex flex-col">
          <nav className="flex flex-col gap-6 text-xl font-bold text-ink">
            {!user ? (
              <>
                <a href="/#features" onClick={() => setMobileMenuOpen(false)}>Features</a>
                <a href="/#workflow" onClick={() => setMobileMenuOpen(false)}>How it works</a>
                <a href="/#pricing" onClick={() => setMobileMenuOpen(false)}>Pricing</a>
              </>
            ) : (
              <>
                <Link to="/app/dashboard" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3"><LayoutDashboard size={20} /> Dashboard</Link>
                <Link to="/app/upload" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3"><FileUp size={20} /> Upload</Link>
                <Link to="/app/settings" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3"><Settings size={20} /> Settings</Link>
              </>
            )}
          </nav>
          <div className="mt-8 flex flex-col gap-4">
            {!user ? (
              <>
                <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="py-3 text-center rounded-xl bg-mist text-ink font-semibold">Sign in</Link>
                <Link to="/register" onClick={() => setMobileMenuOpen(false)} className="py-3 text-center rounded-xl bg-brandBlue text-white font-semibold">Get started</Link>
              </>
            ) : (
              <button onClick={() => { logout(); setMobileMenuOpen(false); }} className="py-3 text-center rounded-xl bg-mist text-ink font-semibold flex items-center justify-center gap-2">
                <LogOut size={18} /> Sign out
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}
