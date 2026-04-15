import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';

export default function Layout() {
  const { user, logout } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeSection, setActiveSection] = useState('hero');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  useEffect(() => {
    if (location.pathname === '/' && !user) {
      const options = {
        root: null,
        rootMargin: '-50% 0px -50% 0px',
        threshold: 0
      };

      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      }, options);

      const sections = ['hero', 'how-it-works', 'features', 'pricing'];
      sections.forEach(id => {
        const el = document.getElementById(id);
        if (el) observer.observe(el);
      });

      return () => observer.disconnect();
    }
  }, [location.pathname, user]);

  const navLinks = [
    { path: user ? '/dashboard' : '/#hero', id: 'hero', label: user ? 'Dashboard' : 'Home' },
    ...(user ? [
      { path: '/history', label: 'History' },
      { path: '/export', label: 'Export' },
      { path: '/pricing', label: 'Buy Credits' },
      { path: '/integrations', label: 'Integrations' }
    ] : [
      { path: '/#how-it-works', id: 'how-it-works', label: 'How it Works' },
      { path: '/#features', id: 'features', label: 'Features' },
      { path: '/#pricing', id: 'pricing', label: 'Pricing' }
    ]),
    ...(user?.isAdmin ? [{ path: '/admin', label: 'Admin Panel' }] : []),
  ];

  const isActive = (link) => {
    if (!user && location.pathname === '/') {
      return activeSection === link.id;
    }
    return location.pathname === link.path;
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col font-inter">
      {/* Top Navigation Bar */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        location.pathname === '/' && !user 
          ? (activeSection === 'hero' ? 'bg-transparent py-4' : 'bg-white/80 backdrop-blur-md border-b border-slate-200/15 shadow-sm h-16')
          : 'bg-white/80 backdrop-blur-md border-b border-slate-200/15 shadow-sm h-16'
      }`}>
        <div className="flex justify-between items-center px-6 h-full w-full max-w-[1440px] mx-auto">
          <div className="flex items-center gap-8">
            <Link to={user ? "/dashboard" : "/"} className="text-xl font-black tracking-tighter text-slate-900 group flex items-center gap-2">
              <span className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white text-xs">A</span>
              Atlas Data Mining
            </Link>
            <div className="hidden md:flex gap-6">
              {navLinks.map(link => (
                link.path.startsWith('/#') ? (
                  <a
                    key={link.id}
                    href={link.path.substring(1)}
                    className={`font-inter tracking-tight transition-all pb-1 text-sm ${
                      isActive(link)
                        ? 'text-primary font-bold border-b-2 border-primary'
                        : 'text-slate-500 hover:text-slate-800 font-medium'
                    }`}
                  >
                    {link.label}
                  </a>
                ) : (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`font-inter tracking-tight transition-all pb-1 text-sm ${
                      isActive(link)
                        ? 'text-primary font-bold border-b-2 border-primary'
                        : 'text-slate-500 hover:text-slate-800 font-medium'
                    }`}
                  >
                    {link.label}
                  </Link>
                )
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4">
            {user ? (
              <>
                {/* Credits Badge */}
                <div className="bg-primary/10 text-primary px-4 py-1.5 rounded-full text-xs font-black flex items-center gap-2 border border-primary/20">
                  <span className="text-sm">⛏️</span> {user.tokens} CREDITS
                </div>

                <div className="flex items-center gap-3 pl-4 border-l border-outline-variant/30">
                  <button
                    onClick={handleLogout}
                    className="text-slate-500 hover:text-slate-800 transition-colors text-sm font-bold"
                  >
                    Logout
                  </button>
                  <div className="w-9 h-9 rounded-xl bg-primary shadow-lg shadow-primary/20 flex items-center justify-center text-white font-black text-sm uppercase">
                    {user.username?.charAt(0)}
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-4">
                <Link to="/login" className="text-slate-500 hover:text-slate-800 text-sm font-bold tracking-tight">Login</Link>
                <Link to="/register" className="cta-gradient text-white px-6 py-2.5 rounded-xl text-sm font-black inner-glow shadow-xl shadow-primary/25 hover:scale-105 active:scale-95 transition-all">Start Mining</Link>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className={`${location.pathname === '/' && !user ? 'pt-0' : 'pt-24'} pb-20 max-w-[1440px] mx-auto w-full flex-1 px-6`}>
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="py-16 bg-surface-container-low border-t border-outline-variant/10">
        <div className="max-w-[1440px] mx-auto px-6 grid grid-cols-1 md:grid-cols-2 justify-between items-center gap-8">
          <div className="flex items-center gap-4">
            <span className="text-2xl font-black text-on-surface tracking-tighter">Atlas Data Mining</span>
            <span className="h-6 w-[1px] bg-outline-variant"></span>
            <span className="text-xs font-bold text-outline uppercase tracking-widest leading-none">B2B Intelligence<br />Scraper Engine</span>
          </div>
          <div className="flex flex-col md:items-end gap-2">
            <p className="text-xs text-outline font-bold uppercase tracking-widest">© 2025 Atlas Data Mining Inc.</p>
            <p className="text-[10px] text-outline-variant font-medium">Precision high-intent lead generation across all sectors.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
