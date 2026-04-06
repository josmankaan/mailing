import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';

export default function Layout() {
  const { user, logout } = useApp();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLinks = [
    { path: '/', label: 'Dashboard' },
    { path: '/history', label: 'History' },
    { path: '/export', label: 'Export' },
    { path: '/integrations', label: 'Integrations' },
    ...(user?.isAdmin ? [{ path: '/admin', label: 'Admin' }] : []),
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <div className="min-h-screen bg-surface flex flex-col font-inter">
      {/* Top Navigation Bar */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/15 shadow-sm">
        <div className="flex justify-between items-center px-6 h-16 w-full max-w-[1440px] mx-auto">
          <div className="flex items-center gap-8">
            <Link to="/" className="text-xl font-bold tracking-tighter text-slate-900">Atlas Prime</Link>
            {user && (
              <div className="hidden md:flex gap-6">
                {navLinks.map(link => (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`font-inter tracking-tight transition-colors pb-1 ${
                      isActive(link.path)
                        ? 'text-blue-700 font-semibold border-b-2 border-blue-700'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            {user ? (
              <>
                {/* Credits Badge */}
                <div className="bg-secondary-container text-on-secondary-container px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                  <span className="text-sm">🪙</span> {user.tokens} Credits
                </div>

                <div className="flex items-center gap-3 pl-4 border-l border-outline-variant/30">
                  <button
                    onClick={handleLogout}
                    className="text-slate-500 hover:text-slate-800 transition-colors text-sm font-medium"
                  >
                    Logout
                  </button>
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm uppercase">
                    {user.username?.charAt(0)}
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login" className="text-slate-500 hover:text-slate-800 text-sm font-medium">Giriş Yap</Link>
                <Link to="/register" className="cta-gradient text-white px-4 py-2 rounded-lg text-sm font-bold inner-glow shadow-lg shadow-primary/20 hover:opacity-90 transition-all">Kayıt Ol</Link>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="pt-24 pb-20 px-6 max-w-[1440px] mx-auto w-full flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="py-12 bg-surface-container-low border-t border-outline-variant/10">
        <div className="max-w-[1440px] mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <span className="text-xl font-black text-on-surface tracking-tighter">Atlas Prime</span>
            <span className="h-4 w-[1px] bg-outline-variant"></span>
            <span className="text-xs font-bold text-outline uppercase tracking-widest">Precision Intelligence</span>
          </div>
          <p className="text-xs text-outline font-medium">© 2025 Atlas Prime Intelligence Systems.</p>
        </div>
      </footer>
    </div>
  );
}
