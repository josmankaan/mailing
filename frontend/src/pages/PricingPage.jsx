import React from 'react';
import PricingComponent from '../components/PricingComponent';

export default function PricingPage() {
  return (
    <div className="py-12">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <nav className="flex items-center justify-center gap-2 text-outline mb-4 uppercase tracking-widest font-semibold text-[0.6875rem]">
            <span>Account</span>
            <span className="material-symbols-outlined text-xs">chevron_right</span>
            <span className="text-primary">Credits</span>
          </nav>
          <h1 className="text-4xl md:text-6xl font-black text-on-surface tracking-tighter mb-4">Add Mining Credits</h1>
          <p className="text-xl text-on-surface-variant max-w-2xl mx-auto">
            Choose the package that fits your extraction needs. Instant delivery to your account.
          </p>
        </div>
        
        <PricingComponent />
      </div>
    </div>
  );
}
