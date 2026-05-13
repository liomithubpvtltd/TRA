"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { API } from "@/api/axios";

export default function BusinessLandingPage() {
  const [activePricing, setActivePricing] = useState<"monthly" | "yearly">("monthly");
  const [contactForm, setContactForm] = useState({ name: "", email: "", message: "" });
  const [contactStatus, setContactStatus] = useState<string | null>(null);
  const [plans, setPlans] = useState<any[]>([]);
  const [isReady, setIsReady] = useState(false);
  const router = useRouter();
  const { accessToken } = useAuthStore();

  useEffect(() => {
    if (typeof window === "undefined") return;

    const pathname = window.location.pathname;
    const hostname = window.location.hostname;
    const isLocal = hostname === "localhost" || hostname === "127.0.0.1";
    const isRoot = pathname === "/" || pathname === "/index.html";
    const firstSegment = pathname.split('/')[1] || "";
    
    // Valid top-level routes in tlmfront
    const validRoutes = [
      "home", "portfolio", "orders", "reports", "profile", "payment", "login", "signup"
    ];

    if (isRoot) {
      if (accessToken) {
        router.replace("/home");
      } else {
        setIsReady(true);
      }
    } else {
      if (validRoutes.includes(firstSegment)) {
        // Only redirect to .html files in production (not localhost)
        if (!isLocal && !pathname.endsWith('.html')) {
          const cleanPath = pathname.replace(/\/$/, "");
          // Mark that we are doing a redirect bounce so the target page
          // can detect it's the real load (not the CloudFront bounce).
          sessionStorage.setItem('__spa_redirect', cleanPath);
          router.replace(`${cleanPath}${window.location.search}`);
        }
      } else {
        // Fallback to home if not a valid dashboard route
        if (!isLocal) {
          window.location.replace("/index.html");
        }
      }
    }
  }, [router, accessToken]);

  const getDurationSuffix = (days: number) => {
    if (days < 30) return `/${days}d`;
    if (days < 365) return `/${Math.round(days / 30)}mo`;
    return `/${Math.round(days / 365)}yr`;
  };

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const response = await API.get('/api/subscriptions/plandetails/');
        setPlans(response.data.plans || []);
      } catch (error) {
        console.error("Failed to fetch subscription plans:", error);
      }
    };
    fetchPlans();
  }, []);

  if (!isReady) return null;

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Execute mock submission safely
    setContactStatus("Submitting...");
    setTimeout(() => {
      setContactStatus("Success! Message dispatched securely.");
      setContactForm({ name: "", email: "", message: "" });
    }, 1000);
  };

  const features = [
    {
      title: "Real-Time Feeds",
      desc: "Institutional-grade latency mappings providing continuous updates on breakout patterns.",
      icon: "⚡"
    },
    {
      title: "Technical Screeners",
      desc: "Automated algorithms tracking oversold setups, volume triggers, and RSI trends.",
      icon: "📊"
    },
    {
      title: "Multi-Target Insights",
      desc: "Definitive step milestones across temporal boundaries for precise trade management.",
      icon: "🎯"
    },
    {
      title: "Portfolio Allocation",
      desc: "Optimize your holdings with live valuations and robust allocation capabilities.",
      icon: "💼"
    },
    {
      title: "Security Measures",
      desc: "Multi-factor deployment encryptions preventing data vulnerability vectors.",
      icon: "🔒"
    },
    {
      title: "Live Integration",
      desc: "WebSocket execution bindings connecting client clusters perfectly.",
      icon: "🖧"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-black to-slate-950 text-zinc-100 font-sans relative overflow-hidden">
      {/* Decorative Ambient Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[30rem] h-[30rem] rounded-full bg-teal-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[30rem] h-[30rem] rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none" />

      {/* Navigation Header */}
      <header className="w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between relative z-20">
        <div className="flex items-center gap-2 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-400 to-indigo-600 flex items-center justify-center text-zinc-950 font-black text-lg shadow-lg transform group-hover:rotate-12 transition-all duration-300">
            TM
          </div>
          <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-zinc-100 to-zinc-400 bg-clip-text text-transparent">
            TimelessMoney
          </span>
        </div>

        <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-zinc-400">
          <a href="#features" className="hover:text-zinc-100 transition-colors">Features</a>
          <a href="#pricing" className="hover:text-zinc-100 transition-colors">Pricing</a>
          <a href="#contact" className="hover:text-zinc-100 transition-colors">Contact Us</a>
        </nav>

        <div className="flex items-center gap-4">
          <Link 
            href="/login" 
            className="px-4 py-2 text-sm font-bold text-zinc-300 hover:text-zinc-100 transition-all duration-200"
          >
            Sign In
          </Link>
          <Link 
            href="/signup" 
            className="px-5 py-2.5 text-sm font-bold bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-400 hover:to-teal-500 text-zinc-950 rounded-xl shadow-lg transform hover:scale-102 active:scale-98 transition-all duration-200"
          >
            Get Started
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-28 flex flex-col items-center text-center relative z-10">
        <div className="inline-flex items-center gap-2 bg-zinc-800/40 border border-zinc-700/30 rounded-full px-4 py-1.5 mb-6 backdrop-blur-md shadow-inner">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-400"></span>
          </span>
          <span className="text-xs font-extrabold text-teal-300 uppercase tracking-wider">
            Institutional Precision
          </span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-black tracking-tight bg-gradient-to-r from-zinc-100 via-zinc-200 to-zinc-500 bg-clip-text text-transparent leading-tight sm:leading-tight max-w-4xl">
          Master Market Dynamics With Institutional Speed
        </h1>
        
        <p className="text-zinc-400 mt-6 text-base sm:text-lg max-w-2xl leading-relaxed">
          Track breakouts, allocate capital, and manage robust portfolio operations using live execution dashboards.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center gap-4 justify-center">
          <Link 
            href="/home" 
            className="px-8 py-3.5 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-400 hover:to-teal-500 text-zinc-950 font-extrabold text-sm uppercase tracking-wider rounded-xl shadow-xl shadow-teal-500/10 transform hover:scale-102 active:scale-98 transition-all duration-200"
          >
            Launch Dashboard
          </Link>
          <a 
            href="#features" 
            className="px-8 py-3.5 bg-zinc-900/80 hover:bg-zinc-800/80 text-zinc-300 border border-zinc-800 font-bold text-sm uppercase tracking-wider rounded-xl backdrop-blur-md transform hover:scale-102 active:scale-98 transition-all duration-200"
          >
            Learn More
          </a>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="max-w-6xl mx-auto px-6 py-20 border-t border-zinc-900 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-black bg-gradient-to-r from-zinc-100 to-zinc-400 bg-clip-text text-transparent">
            Execution Capabilities
          </h2>
          <p className="text-zinc-500 text-sm mt-2 font-semibold">Built robustly for temporal edge advantages.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feat, idx) => (
            <div 
              key={idx} 
              className="bg-zinc-900/30 border border-zinc-800/60 rounded-2xl p-6 hover:border-teal-500/30 transition-all duration-300 flex flex-col group relative"
            >
              <div className="absolute inset-0 opacity-0 group-hover:opacity-[0.02] bg-gradient-to-br from-teal-400 to-indigo-600 rounded-2xl transition-all duration-300 pointer-events-none" />
              <div className="text-3xl mb-4">{feat.icon}</div>
              <h3 className="text-zinc-200 font-extrabold text-base mb-2">{feat.title}</h3>
              <p className="text-zinc-500 text-xs leading-relaxed font-medium">{feat.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="max-w-5xl mx-auto px-6 py-20 border-t border-zinc-900 relative z-10">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-black bg-gradient-to-r from-zinc-100 to-zinc-400 bg-clip-text text-transparent">
            Flexible Pricing Structures
          </h2>
          <div className="flex items-center justify-center mt-6">
            <div className="bg-zinc-950/50 border border-zinc-800/60 p-1 rounded-xl flex gap-2">
              <button 
                onClick={() => setActivePricing("monthly")}
                className={`px-4 py-2 text-xs font-bold rounded-lg transition-all duration-200 ${activePricing === "monthly" ? "bg-teal-500/10 text-teal-400 border border-teal-500/30 shadow-inner" : "text-zinc-500 hover:text-zinc-300"}`}
              >
                Monthly
              </button>
              <button 
                onClick={() => setActivePricing("yearly")}
                className={`px-4 py-2 text-xs font-bold rounded-lg transition-all duration-200 ${activePricing === "yearly" ? "bg-teal-500/10 text-teal-400 border border-teal-500/30 shadow-inner" : "text-zinc-500 hover:text-zinc-300"}`}
              >
                Yearly (20% Off)
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.filter(p => activePricing === "monthly" ? p.duration_days < 365 : p.duration_days >= 365).length > 0 ? plans.filter(p => activePricing === "monthly" ? p.duration_days < 365 : p.duration_days >= 365).map((plan: any) => (
            <div key={plan.id} className="bg-zinc-900/60 border border-zinc-800/80 rounded-3xl p-8 shadow-2xl relative flex flex-col items-center group hover:border-teal-500/40 transition-all duration-300">
              <div className="absolute -inset-px bg-gradient-to-r from-teal-500/10 to-indigo-500/10 rounded-3xl blur opacity-20 group-hover:opacity-40 transition-all duration-300 pointer-events-none" />
              <span className="text-zinc-300 text-sm font-black uppercase tracking-widest text-center h-8 flex items-center justify-center">
                {plan.displayname || plan.name}
              </span>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-5xl font-black text-zinc-100">
                  {plan.currency === 'INR' ? '₹' : '$'}
                  {Number(plan.price).toFixed(0)}
                </span>
                <span className="text-zinc-500 text-xs font-bold whitespace-nowrap">
                  {getDurationSuffix(plan.duration_days)} <span className="text-[10px] ml-0.5">+ {Number(plan.gst_percentage).toFixed(0)}% GST</span>
                </span>
              </div>

              <div className="w-full border-t border-zinc-800/60 my-6" />

              <ul className="w-full text-left space-y-3 mb-8 text-xs font-bold text-zinc-400 flex-1">
                {plan.description ? plan.description.split('\n').filter((line: string) => line.trim() !== "").map((line: string, i: number) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-teal-400 mt-0.5">✓</span> <span className="leading-relaxed">{line.trim()}</span>
                  </li>
                )) : (
                  <>
                    <li className="flex items-center gap-2">
                      <span className="text-teal-400">✓</span> {plan.max_portfolios} Max Portfolios
                    </li>
                    <li className="flex items-center gap-2">
                      <span className={plan.real_time_data ? "text-teal-400" : "text-zinc-600"}>✓</span> Real-Time Data
                    </li>
                    <li className="flex items-center gap-2">
                      <span className={plan.advanced_analytics ? "text-teal-400" : "text-zinc-600"}>✓</span> Advanced Analytics
                    </li>
                  </>
                )}
              </ul>

              <Link 
                href={`/signup?id=${plan.id}`} 
                className="w-full mt-auto text-center py-3 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-400 hover:to-teal-500 text-zinc-950 font-extrabold text-sm uppercase tracking-wider rounded-xl shadow-lg transform active:scale-98 transition-all duration-200"
              >
                Get Started
              </Link>
            </div>
          )) : (
            <div className="col-span-full text-center text-zinc-500 text-sm font-bold animate-pulse">Loading plans...</div>
          )}
        </div>
      </section>

      {/* Contact Us Section */}
      <section id="contact" className="max-w-6xl mx-auto px-6 py-20 border-t border-zinc-900 relative z-10">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-black bg-gradient-to-r from-zinc-100 to-zinc-400 bg-clip-text text-transparent">
            Get In Touch
          </h2>
          <p className="text-zinc-500 text-sm mt-2 font-semibold">Ready to streamline your investment infrastructure?</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-start">
          {/* Left Side details */}
          <div className="flex flex-col gap-6 bg-zinc-950/30 border border-zinc-800/60 rounded-3xl p-8 text-zinc-300">
            <div>
              <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">Office Location</h4>
              <p className="text-sm text-zinc-300 leading-relaxed">Shop No. zrhzesrhz erzsedtrhnszet dhnzxdt nhxzt aeth erahg</p>
            </div>
            <div className="border-t border-zinc-900/60 my-2" />
            <div>
              <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">Phone Number</h4>
              <p className="text-sm text-zinc-300 font-bold">+91 9898989898</p>
            </div>
            <div className="border-t border-zinc-900/60 my-2" />
            <div>
              <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">Email Address</h4>
              <p className="text-sm text-teal-400 font-semibold hover:underline cursor-pointer">info@timelessmoney.com</p>
            </div>

            <div className="rounded-2xl overflow-hidden h-48 border border-zinc-800/80 mt-4 relative shadow-inner bg-zinc-900/50 flex items-center justify-center text-xs font-bold text-zinc-600">
              Mapping operational frameworks...
            </div>
          </div>

          {/* Right Side Form */}
          <form onSubmit={handleContactSubmit} className="bg-zinc-900/40 border border-zinc-800/60 rounded-3xl p-8 flex flex-col gap-4 relative shadow-2xl">
            <div>
              <label className="text-[11px] text-zinc-400 font-bold uppercase tracking-wider">Full Name</label>
              <input 
                type="text" 
                required 
                value={contactForm.name}
                onChange={(e) => setContactForm({...contactForm, name: e.target.value})}
                placeholder="John Doe" 
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 mt-1.5 text-sm font-semibold text-zinc-100 focus:outline-none focus:border-teal-500/50 transition-all"
              />
            </div>
            
            <div>
              <label className="text-[11px] text-zinc-400 font-bold uppercase tracking-wider">Email Address</label>
              <input 
                type="email" 
                required 
                value={contactForm.email}
                onChange={(e) => setContactForm({...contactForm, email: e.target.value})}
                placeholder="john@example.com" 
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 mt-1.5 text-sm font-semibold text-zinc-100 focus:outline-none focus:border-teal-500/50 transition-all"
              />
            </div>

            <div>
              <label className="text-[11px] text-zinc-400 font-bold uppercase tracking-wider">Your Message</label>
              <textarea 
                rows={4} 
                required 
                value={contactForm.message}
                onChange={(e) => setContactForm({...contactForm, message: e.target.value})}
                placeholder="How can our algorithms assist your trading goals?" 
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 mt-1.5 text-sm font-semibold text-zinc-100 focus:outline-none focus:border-teal-500/50 transition-all resize-none"
              />
            </div>

            {contactStatus && (
              <p className={`text-xs font-bold text-center ${contactStatus.includes('Success') ? 'text-teal-400' : 'text-amber-400'}`}>
                {contactStatus}
              </p>
            )}

            <button 
              type="submit" 
              className="w-full text-center py-3 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-400 hover:to-teal-500 text-zinc-950 font-extrabold text-sm uppercase tracking-wider rounded-xl shadow-lg transform active:scale-98 transition-all duration-200 mt-2"
            >
              Send Message
            </button>
          </form>
        </div>
      </section>

      {/* Proper Footer Section */}
      <footer className="w-full border-t border-zinc-900 bg-zinc-950/80 relative z-10 px-6 py-12">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-left">
          <div>
            <h4 className="text-xs font-bold uppercase text-zinc-300 tracking-wider mb-4">Product</h4>
            <ul className="text-xs font-semibold text-zinc-500 space-y-2">
              <li><a href="#features" className="hover:text-zinc-300 transition-colors">Features</a></li>
              <li><a href="#pricing" className="hover:text-zinc-300 transition-colors">Pricing</a></li>
              <li><Link href="/home" className="hover:text-zinc-300 transition-colors">Live Dashboard</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-xs font-bold uppercase text-zinc-300 tracking-wider mb-4">Legal</h4>
            <ul className="text-xs font-semibold text-zinc-500 space-y-2">
              <li><span className="hover:text-zinc-300 transition-colors cursor-pointer">Terms of Service</span></li>
              <li><span className="hover:text-zinc-300 transition-colors cursor-pointer">Privacy Policy</span></li>
              <li><span className="hover:text-zinc-300 transition-colors cursor-pointer">Risk Disclosure</span></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase text-zinc-300 tracking-wider mb-4">Contact</h4>
            <ul className="text-xs font-semibold text-zinc-500 space-y-2">
              <li><a href="#contact" className="hover:text-zinc-300 transition-colors">Support Helpdesk</a></li>
              <li><span className="hover:text-zinc-300 transition-colors cursor-pointer">Institutional Sales</span></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase text-zinc-300 tracking-wider mb-4">Company</h4>
            <ul className="text-xs font-semibold text-zinc-500 space-y-2">
              <li><span className="hover:text-zinc-300 transition-colors cursor-pointer">About Us</span></li>
              <li><span className="hover:text-zinc-300 transition-colors cursor-pointer">Media Kit</span></li>
            </ul>
          </div>
        </div>
        
        <div className="max-w-6xl mx-auto border-t border-zinc-900/60 mt-10 pt-6 text-center text-xs text-zinc-600 font-bold">
          © {new Date().getFullYear()} TimelessMoney. All operational parameters executed securely.
        </div>
      </footer>
    </div>
  );
}
