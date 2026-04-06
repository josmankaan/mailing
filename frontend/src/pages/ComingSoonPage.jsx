import React from 'react';
import { useLocation } from 'react-router-dom';

export default function ComingSoonPage() {
  const location = useLocation();
  const pageName = location.pathname.replace('/', '').charAt(0).toUpperCase() + location.pathname.slice(2);

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center">
        <div className="w-24 h-24 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
          <span className="material-symbols-outlined text-5xl text-primary">construction</span>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-on-surface mb-2">{pageName}</h1>
        <p className="text-on-surface-variant text-sm max-w-md mx-auto mb-8">
          This feature is currently under development. We're building something extraordinary — stay tuned for updates.
        </p>
        <div className="inline-flex items-center gap-2 bg-secondary-container text-on-secondary-container px-4 py-2 rounded-full text-xs font-bold">
          <span className="material-symbols-outlined text-sm" style={{fontVariationSettings: "'FILL' 1"}}>schedule</span>
          Coming Soon
        </div>
      </div>
    </div>
  );
}
