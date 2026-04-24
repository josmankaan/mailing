import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Database } from 'lucide-react';
import { useApp } from '../contexts/AppContext';

const pricingPlans = [
  {
    name: "Starter",
    price: "15",
    period: "one-time",
    credits: "1,000",
    url: "https://buy.polar.sh/polar_cl_xve4aj2QhkojbrVyaYLVofZenHw04Xy0mtV3c2OZUxo",
    features: [
      "1,000 Mining Credits",
      "Instant Email Extraction",
      "Social Media Discovery",
      "Phone Number Lookup",
      "Standard Export (CSV)",
      "Email Support"
    ],
    cta: "Get Started",
    highlight: false
  },
  {
    name: "Growth",
    price: "39",
    period: "one-time",
    credits: "5,000",
    url: "https://buy.polar.sh/polar_cl_EAvUNzZVojfGCkpl8YtWYI5gsLOOl3JcI2aEA3HGatU",
    features: [
      "5,000 Mining Credits",
      "Advanced Contact Refinement",
      "Priority AI Processing",
      "Deep Social Link Analysis",
      "Bulk Lead Export",
      "24/7 Priority Support"
    ],
    cta: "Start Growing",
    highlight: true
  },
  {
    name: "Scale",
    price: "199",
    period: "one-time",
    credits: "20,000",
    url: "https://buy.polar.sh/polar_cl_lpAJjrd5nzHRt2zOz5Mnw7gt6gV766ZcyoWOX2LJzqo",
    features: [
      "20,000 Mining Credits",
      "Unlimited Bulk Operations",
      "Enterprise-Grade Extraction",
      "Admin Dashboard Access",
      "API Access",
      "Dedicated Support"
    ],
    cta: "Scale Up",
    highlight: false
  }
];

export default function PricingComponent() {
  const { user } = useApp();

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
      {pricingPlans.map((plan, i) => {
        let checkoutLink = "/register";
        
        if (user) {
          // Eğer kullanıcı giriş yapmışsa, checkout url'ine email adresini ekleyelim.
          checkoutLink = `${plan.url}?customer_email=${encodeURIComponent(user.email)}`;
        }

        return (
          <div key={i} className={`relative flex flex-col p-10 rounded-[32px] border transition-all hover:translate-y-[-8px] ${
            plan.highlight 
              ? 'bg-surface-container shadow-2xl shadow-primary/20 border-primary border-2 scale-105 z-10' 
              : 'bg-surface-container-lowest border-outline-variant/10 shadow-lg'
          }`}>
            {plan.highlight && (
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary text-white px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest shadow-lg">
                Best Value
              </div>
            )}
            
            <div className="mb-8">
              <h3 className="text-lg font-bold text-outline uppercase tracking-widest mb-4">{plan.name}</h3>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black text-on-surface">$</span>
                <span className="text-6xl font-black text-on-surface tracking-tighter">{plan.price}</span>
                <span className="text-on-surface-variant font-bold ml-1">/{plan.period}</span>
              </div>
            </div>

            <div className="mb-8 p-4 bg-primary/5 rounded-2xl">
              <p className="text-sm font-black text-primary uppercase tracking-tighter flex items-center gap-2">
                <Database size={16} /> {plan.credits} Mining Credits
              </p>
            </div>

            <ul className="space-y-4 mb-10 flex-1 text-sm font-medium">
              {plan.features.map((feature, fi) => (
                <li key={fi} className="flex items-center gap-3 text-on-surface">
                  <CheckCircle2 size={18} className="text-primary flex-shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>

            {user ? (
              <a
                href={checkoutLink}
                className={`w-full py-5 rounded-2xl font-black text-center transition-all block ${
                  plan.highlight 
                    ? 'cta-gradient text-white shadow-xl shadow-primary/20 hover:scale-105' 
                    : 'bg-surface hover:bg-outline-variant/10 text-on-surface border border-outline-variant/20 hover:scale-105'
                }`}
              >
                {plan.cta}
              </a>
            ) : (
              <Link
                to={checkoutLink}
                className={`w-full py-5 rounded-2xl font-black text-center transition-all block ${
                  plan.highlight 
                    ? 'cta-gradient text-white shadow-xl shadow-primary/20 hover:scale-105' 
                    : 'bg-surface hover:bg-outline-variant/10 text-on-surface border border-outline-variant/20 hover:scale-105'
                }`}
              >
                {plan.cta}
              </Link>
            )}
          </div>
        );
      })}
    </div>
  );
}
