import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Rocket, 
  Shield, 
  Zap, 
  Search, 
  BarChart3, 
  Mail, 
  Globe, 
  CheckCircle2,
  ArrowRight,
  Database,
  Cpu,
  Layers
} from 'lucide-react';
import PricingComponent from '../components/PricingComponent';

export default function LandingPage() {
  return (
    <div className="bg-surface selection:bg-primary selection:text-white overflow-hidden">
      {/* Hero Section */}
      <section id="hero" className="relative pt-20 pb-32 lg:pt-32 lg:pb-48">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 opacity-30">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[128px] animate-pulse"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary/20 rounded-full blur-[128px] animate-pulse delay-700"></div>
        </div>

        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/5 border border-primary/10 text-primary text-sm font-bold mb-8 animate-fade-in">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            Atlas Data Mining v2.4 Is Now Live
          </div>
          
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-on-surface mb-8 leading-[0.9]">
            MINE LEADS <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-blue-600 to-secondary">LIKE A PRO.</span>
          </h1>
          
          <p className="max-w-2xl mx-auto text-xl text-on-surface-variant mb-12 font-medium">
            Deploy Atlas intelligence to discover hidden emails, social profiles, and phone numbers. 
            Automated B2B precision intelligence for high-intent growth.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/register" className="w-full sm:w-auto cta-gradient text-white px-10 py-5 rounded-2xl font-black text-lg shadow-xl shadow-primary/25 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3">
              Get Started for Free <ArrowRight size={20} />
            </Link>
            <div className="text-sm font-bold text-outline uppercase tracking-widest px-6 py-2">
              50 Free Mining Credits On Signup
            </div>
          </div>
        </div>
      </section>

      {/* Video Demo Section */}
      <section id="how-it-works" className="py-24 bg-surface relative overflow-hidden">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-5xl font-black text-on-surface tracking-tighter mb-4 text-center">SEE IT IN ACTION</h2>
            <p className="text-on-surface-variant max-w-xl mx-auto">Watch how Atlas Data Mining transforms raw sector data into high-value leads in real-time.</p>
          </div>
          
          <div className="relative aspect-video rounded-[32px] overflow-hidden shadow-2xl shadow-primary/20 border border-outline-variant/10 group">
            <iframe 
              className="absolute inset-0 w-full h-full"
              src="https://www.youtube.com/embed/pF6hbBDt6NE?si=nqjAIKX7_yvotf7X" 
              title="YouTube video player" 
              frameBorder="0" 
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
              referrerPolicy="strict-origin-when-cross-origin" 
              allowFullScreen
            ></iframe>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-surface-container-lowest">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="group p-8 rounded-3xl bg-surface border border-outline-variant/10 hover:border-primary/30 transition-all hover:shadow-2xl hover:shadow-primary/5">
              <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform">
                <Mail size={28} />
              </div>
              <h3 className="text-2xl font-black text-on-surface mb-4 tracking-tight">Email Extraction</h3>
              <p className="text-on-surface-variant">Deep-scan target domains to find verified business emails. Filter out noise with AI cleaning.</p>
            </div>
            
            <div className="group p-8 rounded-3xl bg-surface border border-outline-variant/10 hover:border-secondary/30 transition-all hover:shadow-2xl hover:shadow-secondary/5">
              <div className="w-14 h-14 bg-secondary/10 rounded-2xl flex items-center justify-center text-secondary mb-6 group-hover:scale-110 transition-transform">
                <Globe size={28} />
              </div>
              <h3 className="text-2xl font-black text-on-surface mb-4 tracking-tight">Social Discovery</h3>
              <p className="text-on-surface-variant">Automatically find LinkedIn, Instagram, Facebook, and Twitter profiles for your leads.</p>
            </div>

            <div className="group p-8 rounded-3xl bg-surface border border-outline-variant/10 hover:border-blue-500/30 transition-all hover:shadow-2xl hover:shadow-blue-500/5">
              <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-500 mb-6 group-hover:scale-110 transition-transform">
                <Search size={28} />
              </div>
              <h3 className="text-2xl font-black text-on-surface mb-4 tracking-tight">Sector Mining</h3>
              <p className="text-on-surface-variant">Search any industry in any city. Get accurate business intelligence in seconds.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-32">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-6xl font-black text-on-surface tracking-tighter mb-4">Pricing for Every Miner</h2>
            <p className="text-on-surface-variant">Choose the package that fits your extraction needs.</p>
          </div>

          <PricingComponent />
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-24 bg-primary">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12 text-center text-white">
            <div>
              <p className="text-4xl font-black mb-2 tracking-tighter">5M+</p>
              <p className="text-white/60 text-xs font-bold uppercase tracking-widest">Leads Mined</p>
            </div>
            <div>
              <p className="text-4xl font-black mb-2 tracking-tighter">98%</p>
              <p className="text-white/60 text-xs font-bold uppercase tracking-widest">Verification Rate</p>
            </div>
            <div>
              <p className="text-4xl font-black mb-2 tracking-tighter">50K+</p>
              <p className="text-white/60 text-xs font-bold uppercase tracking-widest">Active Miners</p>
            </div>
            <div>
              <p className="text-4xl font-black mb-2 tracking-tighter">24/7</p>
              <p className="text-white/60 text-xs font-bold uppercase tracking-widest">Global Support</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-48 text-center relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] border border-outline-variant/5 rounded-full -z-10 animate-pulse"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-outline-variant/10 rounded-full -z-10 animate-pulse delay-300"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] border border-outline-variant/20 rounded-full -z-10 animate-pulse delay-700"></div>

        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-5xl md:text-7xl font-black tracking-tighter text-on-surface mb-8">READY TO START YOUR FIRST EXPEDITION?</h2>
          <p className="text-xl text-on-surface-variant mb-12">
            Join thousands of data miners today. Use the Atlas Engine to scale your lead generation.
          </p>
          <Link to="/register" className="cta-gradient text-white px-12 py-6 rounded-[32px] font-black text-2xl shadow-2xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all inline-block">
            Get 50 Free Credits Now
          </Link>
        </div>
      </section>
    </div>
  );
}
