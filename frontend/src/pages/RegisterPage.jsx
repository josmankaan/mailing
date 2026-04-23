import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useApp } from '../contexts/AppContext';

export default function RegisterPage() {
  const { register } = useApp();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successState, setSuccessState] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post('https://api.atlasdatamining.com/api/auth/register', { username, email, password });
      if (response.data.success) {
        setSuccessState(true);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Try again.');
      setLoading(false);
    }
  };

  if (successState) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center bg-surface px-6 pt-12">
        <div className="w-full max-w-md bg-surface-container-lowest rounded-[32px] p-10 text-center shadow-2xl border border-outline-variant/10 animate-fade-in">
          <div className="w-24 h-24 bg-primary/10 rounded-[32px] flex items-center justify-center mx-auto mb-8 animate-bounce">
            <span className="material-symbols-outlined text-5xl text-primary" style={{fontVariationSettings: "'FILL' 1"}}>mail</span>
          </div>
          <h1 className="text-3xl font-black text-on-surface mb-2 tracking-tighter uppercase">Check Your Inbox</h1>
          <p className="text-primary font-bold text-xs uppercase tracking-[0.2em] mb-6">Activation Link Sent</p>
          <p className="text-on-surface-variant font-medium text-lg leading-relaxed mb-10">
            We've sent a verification link to <strong className="text-on-surface">{email}</strong>. Please click it to activate your mining expedition.
          </p>
          <div className="space-y-4">
            <Link 
              to="/login" 
              className="block w-full bg-surface-container text-on-surface py-4 rounded-2xl font-black text-lg border border-outline-variant/30 hover:bg-outline-variant/10 transition-all"
            >
              Back to Login
            </Link>
            <p className="text-xs text-on-surface-variant font-medium">
              Didn't receive it? Check your spam or <button className="text-primary font-bold hover:underline">Resend Email</button>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center bg-surface px-6 py-12">
      <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/10 p-10 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight text-on-surface mb-1">Create Account</h1>
          <p className="text-on-surface-variant text-sm">Join Atlas Data Mining — <span className="text-secondary font-bold">50 free credits</span></p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm font-medium flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">error</span>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-primary mb-2 pl-1">Username</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline-variant">person</span>
              <input type="text" required className="w-full pl-10 pr-4 py-3 bg-surface-container-low border-0 rounded-lg focus:ring-2 focus:ring-primary/40 transition-all text-on-surface placeholder:text-outline-variant" placeholder="your_username" value={username} onChange={e => setUsername(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-primary mb-2 pl-1">Email</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline-variant">mail</span>
              <input type="email" required className="w-full pl-10 pr-4 py-3 bg-surface-container-low border-0 rounded-lg focus:ring-2 focus:ring-primary/40 transition-all text-on-surface placeholder:text-outline-variant" placeholder="your@email.com" value={email} onChange={e => setEmail(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-primary mb-2 pl-1">Password</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline-variant">lock</span>
              <input type="password" required className="w-full pl-10 pr-4 py-3 bg-surface-container-low border-0 rounded-lg focus:ring-2 focus:ring-primary/40 transition-all text-on-surface placeholder:text-outline-variant" placeholder="Min 6 characters" value={password} onChange={e => setPassword(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-primary mb-2 pl-1">Confirm Password</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline-variant">lock</span>
              <input type="password" required className="w-full pl-10 pr-4 py-3 bg-surface-container-low border-0 rounded-lg focus:ring-2 focus:ring-primary/40 transition-all text-on-surface placeholder:text-outline-variant" placeholder="••••••••" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
            </div>
          </div>
          <button type="submit" disabled={loading} className="w-full cta-gradient text-white font-bold py-3 px-6 rounded-lg inner-glow shadow-lg shadow-primary/20 hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-60">
            {loading ? (
              <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> Creating...</>
            ) : (
              <><span className="material-symbols-outlined" style={{fontVariationSettings:"'FILL' 1"}}>rocket_launch</span> Create Account (50 Credits)</>
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
