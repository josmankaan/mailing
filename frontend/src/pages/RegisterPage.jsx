import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';

export default function RegisterPage() {
  const { register } = useApp();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', email: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm) { setError('Passwords do not match.'); return; }
    if (form.password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setLoading(true);
    try {
      await register(form.username, form.password, form.email);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/10 p-10 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight text-on-surface mb-1">Create Account</h1>
          <p className="text-on-surface-variant text-sm">Join Atlas Prime — <span className="text-secondary font-bold">1,000 free credits</span></p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-error-container text-on-error-container rounded-lg text-sm font-medium flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">error</span>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-primary mb-2 pl-1">Username</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline-variant">person</span>
              <input type="text" required className="w-full pl-10 pr-4 py-3 bg-surface-container-low border-0 rounded-lg focus:ring-2 focus:ring-primary/40 transition-all text-on-surface placeholder:text-outline-variant" placeholder="your_username" value={form.username} onChange={e => setForm({...form, username: e.target.value})} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-primary mb-2 pl-1">Email</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline-variant">mail</span>
              <input type="email" required className="w-full pl-10 pr-4 py-3 bg-surface-container-low border-0 rounded-lg focus:ring-2 focus:ring-primary/40 transition-all text-on-surface placeholder:text-outline-variant" placeholder="your@email.com" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-primary mb-2 pl-1">Password</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline-variant">lock</span>
              <input type="password" required className="w-full pl-10 pr-4 py-3 bg-surface-container-low border-0 rounded-lg focus:ring-2 focus:ring-primary/40 transition-all text-on-surface placeholder:text-outline-variant" placeholder="Min 6 characters" value={form.password} onChange={e => setForm({...form, password: e.target.value})} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-primary mb-2 pl-1">Confirm Password</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline-variant">lock</span>
              <input type="password" required className="w-full pl-10 pr-4 py-3 bg-surface-container-low border-0 rounded-lg focus:ring-2 focus:ring-primary/40 transition-all text-on-surface placeholder:text-outline-variant" placeholder="••••••••" value={form.confirm} onChange={e => setForm({...form, confirm: e.target.value})} />
            </div>
          </div>
          <button type="submit" disabled={loading} className="w-full cta-gradient text-white font-bold py-3 px-6 rounded-lg inner-glow shadow-lg shadow-primary/20 hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-60">
            {loading ? (
              <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> Creating...</>
            ) : (
              <><span className="material-symbols-outlined" style={{fontVariationSettings:"'FILL' 1"}}>rocket_launch</span> Create Account (1,000 Credits)</>
            )}
          </button>
        </form>

        <p className="text-center text-sm text-outline mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-primary hover:underline font-semibold">Sign In</Link>
        </p>
      </div>
    </div>
  );
}
