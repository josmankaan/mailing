import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';

export default function VerifyEmailPage() {
  const { token } = useParams();
  const [status, setStatus] = useState('verifying'); // verifying, success, error
  const [message, setMessage] = useState('');

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const response = await axios.get(`https://api.atlasdatamining.com/api/auth/verify/${token}`);
        setStatus('success');
        setMessage(response.data.message);
      } catch (err) {
        setStatus('error');
        setMessage(err.response?.data?.error || 'Verification failed. The link may be expired or invalid.');
      }
    };

    if (token) {
      verifyEmail();
    }
  }, [token]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center bg-surface px-6">
      <div className="max-w-md w-full bg-surface-container-lowest rounded-[32px] p-12 text-center shadow-2xl border border-outline-variant/10">
        {status === 'verifying' && (
          <div className="animate-pulse">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-8">
              <span className="material-symbols-outlined text-4xl text-primary animate-spin">sync</span>
            </div>
            <h1 className="text-3xl font-black text-on-surface mb-4">Verifying Email</h1>
            <p className="text-on-surface-variant font-medium text-lg">Please wait while we confirm your mining credentials...</p>
          </div>
        )}

        {status === 'success' && (
          <div className="animate-fade-in">
            <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-8">
              <span className="material-symbols-outlined text-4xl text-green-500" style={{fontVariationSettings: "'FILL' 1"}}>check_circle</span>
            </div>
            <h1 className="text-3xl font-black text-on-surface mb-2 tracking-tighter">SUCCESS!</h1>
            <p className="text-green-600 font-bold text-sm uppercase tracking-widest mb-6">Expedition Authorized</p>
            <p className="text-on-surface-variant font-medium mb-8 leading-relaxed">
              {message || 'Your email has been verified. You are now ready to start mining leads with Atlas.'}
            </p>
            <Link 
              to="/login" 
              className="block w-full cta-gradient text-white py-4 rounded-2xl font-black text-lg shadow-xl shadow-primary/25 hover:scale-105 active:scale-95 transition-all"
            >
              Log In to Dashboard
            </Link>
          </div>
        )}

        {status === 'error' && (
          <div className="animate-fade-in">
            <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-8">
              <span className="material-symbols-outlined text-4xl text-red-500" style={{fontVariationSettings: "'FILL' 1"}}>error</span>
            </div>
            <h1 className="text-3xl font-black text-on-surface mb-2 tracking-tighter">FAILED</h1>
            <p className="text-red-600 font-bold text-sm uppercase tracking-widest mb-6">Access Denied</p>
            <p className="text-on-surface-variant font-medium mb-8 leading-relaxed">
              {message}
            </p>
            <Link 
              to="/register" 
              className="block w-full bg-surface-container text-on-surface py-4 rounded-2xl font-black text-lg border border-outline-variant/30 hover:bg-outline-variant/10 transition-all mb-4"
            >
              Try Registering Again
            </Link>
            <Link to="/" className="text-sm font-bold text-primary hover:underline">Return to Home</Link>
          </div>
        )}
      </div>
    </div>
  );
}
