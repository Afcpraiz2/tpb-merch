import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  ShoppingBag, Search, X, Plus, Minus, Trash2, ChevronRight, 
  ShieldCheck, Truck, Star, CreditCard, Mail, Phone, MapPin, 
  Instagram, Twitter, Facebook, Tag, MessageSquare, Send, Sparkles, Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- API CONFIG ---
const apiKey = "AIzaSyB8rw2touAy0S7MMGN4wLq9IgIyCv_erAg";
const MODEL_NAME = "gemini-2.5-flash-preview-09-2025";

// --- PAYSTACK SCRIPT LOADER ---
const usePaystack = () => {
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://js.paystack.co/v1/inline.js';
    script.async = true;
    script.onload = () => setLoaded(true);
    document.body.appendChild(script);
    return () => { if (document.body.contains(script)) document.body.removeChild(script); };
  }, []);
  return loaded;
};

// --- STYLING HELPERS ---
const KampalaPattern = () => (
  <div className="absolute inset-0 opacity-20 pointer-events-none overflow-hidden">
    <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="dye-smudge">
          <feTurbulence type="fractalNoise" baseFrequency="0.015" numOctaves="4" />
          <feDisplacementMap in="SourceGraphic" scale="30" />
        </filter>
        <radialGradient id="dye-grad" cx="50%" cy="50%" r="60%">
          <stop offset="0%" stopColor="#1e3a8a" />
          <stop offset="100%" stopColor="#020617" />
        </radialGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#dye-grad)" />
      <circle cx="15%" cy="20%" r="200" fill="#2563eb" filter="url(#dye-smudge)" opacity="0.4" />
      <circle cx="85%" cy="80%" r="250" fill="#1d4ed8" filter="url(#dye-smudge)" opacity="0.5" />
      <path d="M0,100 Q250,50 500,100 T1000,100" fill="none" stroke="white" strokeWidth="0.5" opacity="0.1" />
    </svg>
  </div>
);

const AnkaraBorder = ({ className = "" }) => (
  <div className={`h-5 w-full ${className} shadow-lg z-[70]`} style={{
    backgroundImage: `radial-gradient(circle at 10px 10px, #f59e0b 3px, transparent 0), 
                     radial-gradient(circle at 30px 30px, #b45309 6px, transparent 0)`,
    backgroundSize: '40px 40px',
    backgroundColor: '#78350f',
    borderBottom: '2px solid rgba(0,0,0,0.2)'
  }} />
);

// --- PRODUCT DATA ---
const products = [
  { id: 1, name: "TPB 'Signature' Hoodie", price: 32000, category: "Hoodies", image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&q=80&w=600", description: "Heavyweight cotton with TPB logo embroidery. Pure Kampala dye vibes. E heavy, e soft." },
  { id: 2, name: "TPB 'Lamba' Shorts", price: 18000, category: "Shorts", image: "https://images.unsplash.com/photo-1591195853828-11db59a44f6b?auto=format&fit=crop&q=80&w=600", description: "Breathable shorts for the Lagos heat. TPB rubber patch for that street cred." },
  { id: 3, name: "TPB 'Wetin Dey' Tee", price: 14500, category: "Shirts", image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&q=80&w=600", description: "Premium black cotton. No go fade, no go shrink. Original gbedu." },
  { id: 4, name: "TPB Mesh Trucker Cap", price: 9000, category: "Caps", image: "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&q=80&w=600", description: "Structured 5-panel cap. Carry the culture for your head." },
  { id: 5, name: "TPB Street Joggers", price: 25000, category: "Shorts", image: "https://images.unsplash.com/photo-1552902865-b72c031ac5ea?auto=format&fit=crop&q=80&w=600", description: "Slim-fit joggers with Ankara pocket detailing. Sharp for street movement." },
  { id: 6, name: "TPB Branding Tote", price: 6500, category: "Accessories", image: "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&q=80&w=600", description: "Heavy canvas material. Load your market inside, e no go tear." }
];

// --- TPBBOT COMPONENT ---
const TPBbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', text: "Abeg, wetin dey occur? I be TPBbot, your street-smart assistant. How I fit help you today?" }
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const callGemini = async (userQuery) => {
    const systemPrompt = `You are TPBbot, the official AI assistant for "The Pidgin Blog (TPB) Merch House". 
    Your personality: Street smart, cool, helpful, and you speak EXCLUSIVELY in authentic Nigerian Pidgin English.
    Store Info: We sell premium streetwear (Hoodies, Shirts, Caps, Accessories) with Kampala and Ankara details.
    Products Available: ${JSON.stringify(products)}.
    Rules: 
    1. Always answer in Pidgin.
    2. Be enthusiastic about the culture.
    3. If someone asks for a price, tell them the price in Naira (₦).
    4. If they ask for recommendations, suggest something from our product list.
    5. No be boring bot, use slangs like "No dulling", "Gbedu", "Oya", "Sharp-sharp".`;

    let retries = 0;
    const maxRetries = 5;
    
    while (retries < maxRetries) {
      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: userQuery }] }],
            systemInstruction: { parts: [{ text: systemPrompt }] }
          })
        });

        if (!response.ok) throw new Error('API Error');
        const data = await response.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text || "E be like say network dey trip. Try again abeg.";
      } catch (err) {
        const delay = Math.pow(2, retries) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        retries++;
      }
    }
    return "Omo, connection don cut. Refresh the page make we try again.";
  };

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;
    const userMsg = input;
    setInput("");
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsTyping(true);

    const aiResponse = await callGemini(userMsg);
    
    setIsTyping(false);
    setMessages(prev => [...prev, { role: 'assistant', text: aiResponse }]);
  };

  return (
    <div className="fixed bottom-8 right-8 z-[150]">
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="absolute bottom-20 right-0 w-[350px] h-[500px] bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col border-4 border-orange-600/10"
          >
            {/* Bot Header */}
            <div className="bg-blue-950 p-6 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-600 rounded-xl flex items-center justify-center">
                  <Sparkles size={20} />
                </div>
                <div>
                  <h4 className="font-black text-sm uppercase tracking-tighter">TPBbot Assistant</h4>
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                    <span className="text-[10px] opacity-70 uppercase font-black">Online Sharp-Sharp</span>
                  </div>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)}><X size={20} /></button>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-stone-50 font-black text-sm">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] p-4 rounded-[1.5rem] ${
                    m.role === 'user' 
                      ? 'bg-orange-600 text-white rounded-tr-none' 
                      : 'bg-white border border-stone-200 text-stone-800 rounded-tl-none shadow-sm'
                  }`}>
                    {m.text}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-white border border-stone-200 p-4 rounded-[1.5rem] rounded-tl-none flex gap-1">
                    <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 0.6 }} className="w-1.5 h-1.5 bg-stone-300 rounded-full" />
                    <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }} className="w-1.5 h-1.5 bg-stone-300 rounded-full" />
                    <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }} className="w-1.5 h-1.5 bg-stone-300 rounded-full" />
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-stone-100 flex gap-2">
              <input 
                type="text" 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask TPBbot anything..."
                className="flex-1 bg-stone-100 rounded-2xl px-4 py-3 outline-none focus:ring-2 ring-orange-500/20 font-bold text-xs"
              />
              <button 
                onClick={handleSend}
                disabled={isTyping || !input.trim()}
                className="w-12 h-12 bg-stone-950 text-white rounded-2xl flex items-center justify-center hover:bg-orange-600 transition-colors disabled:bg-stone-200"
              >
                <Send size={18} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button 
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        className="w-16 h-16 bg-stone-950 text-white rounded-3xl flex items-center justify-center shadow-3xl relative z-[151] group"
      >
        {isOpen ? <X size={28} /> : (
          <>
            <MessageSquare size={28} />
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-orange-600 rounded-full border-2 border-white animate-bounce" />
          </>
        )}
      </motion.button>
    </div>
  );
};

// --- MAIN APP ---
const App = () => {
  const paystackLoaded = usePaystack();
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState('cart');
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [selectedSizes, setSelectedSizes] = useState({}); 
  const [formData, setFormData] = useState({ fullName: '', email: '', phone: '', address: '' });

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesCategory = activeCategory === 'All' || p.category === activeCategory;
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, searchQuery]);

  const addToCart = (product) => {
    const size = selectedSizes[product.id];
    if (!size && product.category !== 'Accessories' && product.category !== 'Caps') {
      // Small custom message instead of alert
      return; 
    }
    setCart(prev => {
      const itemKey = `${product.id}-${size || 'N/A'}`;
      const exists = prev.find(item => `${item.id}-${item.size}` === itemKey);
      if (exists) return prev.map(item => `${item.id}-${item.size}` === itemKey ? { ...item, qty: item.qty + 1 } : item);
      return [...prev, { ...product, size: size || 'One Size', qty: 1 }];
    });
    setIsCartOpen(true);
    setCheckoutStep('cart');
  };

  const updateQty = (id, size, delta) => {
    setCart(prev => prev.map(item => {
      if (item.id === id && item.size === size) {
        const newQty = Math.max(0, item.qty + delta);
        return newQty === 0 ? null : { ...item, qty: newQty };
      }
      return item;
    }).filter(Boolean));
  };

  const handleInputChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const payWithPaystack = () => {
    if (!paystackLoaded) return;
    const total = cart.reduce((acc, item) => acc + (item.price * item.qty), 0);
    const handler = window.PaystackPop.setup({
      key: 'pk_live_80cab3e2f524cc53e4c88c49fe1f0fccebcb9b23',
      email: formData.email,
      amount: total * 100,
      currency: "NGN",
      ref: 'TPB_' + Date.now(),
      callback: () => {
        setOrderPlaced(true);
        setCart([]);
        setTimeout(() => { setOrderPlaced(false); setIsCartOpen(false); }, 5000);
      }
    });
    handler.openIframe();
  };

  const cartTotal = cart.reduce((acc, item) => acc + (item.price * item.qty), 0);
  const isFormValid = formData.fullName && formData.email && formData.phone && formData.address;

  return (
    <div className="min-h-screen bg-[#fafaf9] text-stone-900 font-sans pb-0 overflow-x-hidden font-black selection:bg-orange-600 selection:text-white">
      <AnkaraBorder className="fixed top-0" />
      
      {/* Navigation */}
      <nav className="sticky top-6 z-50 mx-4 bg-white/80 backdrop-blur-xl rounded-[2rem] shadow-2xl border border-stone-200 mt-6 h-24 flex items-center justify-between px-8 transition-all">
        <div className="flex items-center gap-4">
          <motion.div 
            whileHover={{ rotate: 0 }}
            className="w-14 h-14 bg-blue-950 text-white flex items-center justify-center font-black rounded-2xl -rotate-6 shadow-xl relative overflow-hidden group cursor-pointer"
          >
            <div className="absolute inset-0 opacity-40 bg-[url('https://www.transparenttextures.com/patterns/batik-fabric.png')]"></div>
            <span className="relative z-10 text-2xl font-black">TPB</span>
          </motion.div>
          <div>
            <h1 className="font-black text-2xl tracking-tighter leading-none uppercase">Merch House</h1>
            <span className="text-[10px] font-black text-orange-600 tracking-[0.2em] uppercase">The Pidgin Blog</span>
          </div>
        </div>
        
        <div className="hidden lg:flex flex-1 max-w-lg mx-12">
            <div className="relative w-full">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-stone-400 w-5 h-5" />
                <input 
                    type="text" 
                    placeholder="Wetin you dey find?..." 
                    className="w-full pl-14 pr-6 py-4 bg-stone-100 rounded-[1.5rem] border-none focus:ring-4 ring-orange-500/10 transition-all font-black text-sm"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>
        </div>

        <button onClick={() => setIsCartOpen(true)} className="flex items-center gap-3 bg-stone-950 text-white px-8 py-4 rounded-[1.5rem] hover:bg-orange-600 transition-all shadow-xl active:scale-95 group">
          <ShoppingBag size={22} />
          <span className="hidden sm:inline uppercase tracking-widest text-xs font-black">My Basket</span>
          {cart.length > 0 && <span className="bg-white text-stone-950 text-xs w-7 h-7 rounded-xl flex items-center justify-center font-black ml-1 group-hover:scale-110 transition-transform">{cart.reduce((a, b) => a + b.qty, 0)}</span>}
        </button>
      </nav>

      {/* Hero Section */}
      <header className="relative pt-12 pb-24 px-4">
        <motion.div 
          initial={{ opacity: 0, y: 30 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 1 }}
          className="max-w-7xl mx-auto rounded-[4rem] overflow-hidden relative shadow-3xl bg-blue-950 min-h-[650px] flex items-center text-center md:text-left"
        >
          <KampalaPattern />
          <div className="relative z-10 p-10 md:p-24 text-white max-w-5xl">
            <motion.div 
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="inline-flex items-center gap-3 bg-orange-600 text-white px-6 py-3 rounded-2xl text-[11px] font-black mb-10 tracking-[0.3em] uppercase shadow-lg shadow-orange-600/20"
            >
              <Tag size={18} /> 2026 DROPPING HOT
            </motion.div>
            <h2 className="text-7xl md:text-[11rem] font-black leading-[0.75] mb-10 uppercase tracking-tighter">
              WE NO <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-br from-orange-400 via-yellow-200 to-orange-600">DULL</span>
            </h2>
            <p className="text-xl md:text-3xl text-blue-100/70 mb-14 max-w-2xl font-black tracking-tight leading-snug">
              Pure Kampala vibes, Ankara details, and that TPB energy wey no dey finish. Represent the Identity sharp-sharp.
            </p>
            <div className="flex flex-wrap gap-6 justify-center md:justify-start">
              <button onClick={() => window.scrollTo({ top: 1000, behavior: 'smooth'})} className="px-12 py-6 bg-white text-stone-950 rounded-[2rem] font-black uppercase tracking-widest hover:bg-orange-600 hover:text-white transition-all shadow-xl">Shop Now</button>
              <button onClick={() => setIsCartOpen(true)} className="px-12 py-6 bg-white/10 backdrop-blur-md border-2 border-white/20 text-white rounded-[2rem] font-black uppercase tracking-widest hover:bg-white/20 transition-all">Check Basket</button>
            </div>
          </div>
          {/* Decorative floating icon */}
          <div className="absolute right-[-5%] bottom-[-5%] opacity-10 pointer-events-none">
            <ShoppingBag size={600} />
          </div>
        </motion.div>
      </header>

      {/* Product Grid Container */}
      <main className="max-w-7xl mx-auto px-4 py-24">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-10 mb-20 uppercase">
          <div>
            <h3 className="text-6xl font-black text-stone-900 mb-4 tracking-tighter uppercase">Fresh Gbedu</h3>
            <p className="text-stone-400 text-xs tracking-widest font-black">Original TPB Steeze for your wardrobe</p>
          </div>
          <div className="flex items-center gap-3 overflow-x-auto pb-6 no-scrollbar">
            {["All", "Hoodies", "Shirts", "Caps", "Shorts"].map(cat => (
              <button 
                key={cat} 
                onClick={() => setActiveCategory(cat)} 
                className={`px-10 py-5 rounded-[1.5rem] font-black text-xs transition-all whitespace-nowrap ${activeCategory === cat ? 'bg-orange-600 text-white shadow-2xl scale-105' : 'bg-white text-stone-400 border border-stone-200 hover:border-orange-200'}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-16">
          <AnimatePresence mode='popLayout'>
            {filteredProducts.map((product) => (
              <motion.div 
                key={product.id} 
                layout 
                initial={{ opacity: 0, scale: 0.9 }} 
                animate={{ opacity: 1, scale: 1 }}
                className="group flex flex-col h-full bg-white rounded-[3.5rem] overflow-hidden border border-stone-100 hover:border-orange-400 transition-all duration-700 hover:shadow-[0_40px_80px_-20px_rgba(234,88,12,0.15)] relative"
              >
                <div className="aspect-[1/1.2] bg-stone-50 overflow-hidden relative">
                  <motion.img 
                    whileHover={{ scale: 1.1 }} 
                    transition={{ duration: 0.8 }}
                    src={product.image} 
                    alt={product.name} 
                    className="w-full h-full object-cover" 
                  />
                  <div className="absolute top-10 left-10">
                    <span className="bg-white/95 backdrop-blur-md px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest text-blue-950 shadow-xl border border-stone-100">
                      {product.category}
                    </span>
                  </div>
                </div>
                <div className="p-12 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-6">
                    <h4 className="text-3xl font-black leading-tight uppercase group-hover:text-orange-600 transition-colors tracking-tight">{product.name}</h4>
                    <span className="text-2xl font-black text-stone-950">₦{product.price.toLocaleString()}</span>
                  </div>
                  
                  <p className="text-stone-500 text-sm mb-10 line-clamp-3 leading-relaxed font-black">{product.description}</p>
                  
                  {(product.category !== 'Caps' && product.category !== 'Accessories') && (
                    <div className="mb-10">
                      <p className="text-[10px] font-black uppercase text-stone-400 mb-5 tracking-widest">Select your size:</p>
                      <div className="flex flex-wrap gap-3">
                        {['S', 'M', 'L', 'XL', 'XXL'].map(size => (
                          <button 
                            key={size} 
                            onClick={() => setSelectedSizes(prev => ({ ...prev, [product.id]: size }))} 
                            className={`w-12 h-12 rounded-2xl border-2 flex items-center justify-center font-black text-xs transition-all ${selectedSizes[product.id] === size ? 'bg-stone-950 border-stone-950 text-white shadow-xl scale-110' : 'bg-white border-stone-100 text-stone-400 hover:border-orange-200'}`}
                          >
                            {size}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  <button 
                    onClick={() => addToCart(product)} 
                    className={`mt-auto w-full py-6 rounded-[2rem] font-black text-sm uppercase tracking-[0.2em] transition-all ${(!selectedSizes[product.id] && product.category !== 'Caps' && product.category !== 'Accessories') ? 'bg-stone-100 text-stone-300 cursor-not-allowed' : 'bg-stone-950 text-white hover:bg-orange-600 shadow-2xl active:scale-[0.96]'}`}
                  >
                    Add to Basket
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </main>

      {/* Trust Badges */}
      <section className="max-w-7xl mx-auto px-4 mb-32">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 p-16 bg-blue-950 rounded-[4rem] relative overflow-hidden shadow-3xl text-white">
          <KampalaPattern />
          {[
            { icon: Truck, title: "SHARP DELIVERY", desc: "Lagos to London, Abuja to Atlanta—we go reach you sharp-sharp. No long stories.", color: "bg-orange-600" },
            { icon: ShieldCheck, title: "ORIGINAL GBEDU", desc: "Authentic materials only. No go generic, no go fade. TPB quality stand gidigba.", color: "bg-blue-600" },
            { icon: Star, title: "FOR THE CULTURE", desc: "Support the blog, represent the identity. Every kobo goes back to building the community.", color: "bg-green-600" }
          ].map((item, i) => (
            <div key={i} className="relative z-10 flex flex-col items-center md:items-start text-center md:text-left">
              <div className={`w-20 h-20 ${item.color} rounded-[2rem] flex items-center justify-center text-white mb-8 shadow-2xl scale-110 rotate-3`}>
                <item.icon size={40} />
              </div>
              <h5 className="text-3xl font-black mb-4 uppercase tracking-tighter">{item.title}</h5>
              <p className="text-blue-100/60 font-black text-sm leading-relaxed max-w-xs">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-stone-950 text-white pt-32 pb-16 relative overflow-hidden font-black">
        <div className="max-w-7xl mx-auto px-8 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-20 mb-24">
            <div className="md:col-span-5">
              <div className="flex items-center gap-4 mb-10 justify-center md:justify-start">
                <div className="w-16 h-16 bg-white text-stone-950 flex items-center justify-center font-black rounded-2xl text-2xl shadow-2xl rotate-6">TPB</div>
                <h6 className="font-black text-4xl uppercase tracking-tighter">Merch House</h6>
              </div>
              <p className="text-stone-400 text-lg font-black leading-relaxed max-w-md mx-auto md:mx-0 mb-10">
                The only place where Pidgin excellence meets premium streetwear. We no just dey sell clothes, we dey sell Identity. Support the culture today.
              </p>
              <div className="flex gap-5 justify-center md:justify-start">
                {[Instagram, Twitter, Facebook].map((Icon, i) => (
                  <motion.a key={i} href="#" whileHover={{ y: -8, scale: 1.1 }} className="w-14 h-14 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center transition-all hover:bg-orange-600">
                    <Icon size={24} />
                  </motion.a>
                ))}
              </div>
            </div>

            <div className="md:col-span-4 text-center md:text-left">
              <h6 className="text-[11px] text-orange-500 mb-10 font-black uppercase tracking-[0.4em]">Get in touch</h6>
              <ul className="space-y-6 text-stone-400 text-lg">
                <li className="flex items-center justify-center md:justify-start gap-4 hover:text-white transition-colors cursor-pointer"><Mail size={20} className="text-orange-600" /> contact@thepidginblog.com</li>
                <li className="flex items-center justify-center md:justify-start gap-4 hover:text-white transition-colors cursor-pointer"><Phone size={20} className="text-orange-600" /> +234 (0) 800-TPB-VIBE</li>
                <li className="flex items-center justify-center md:justify-start gap-4 hover:text-white transition-colors cursor-pointer"><MapPin size={20} className="text-orange-600" /> Lagos, Nigeria</li>
              </ul>
            </div>

            <div className="md:col-span-3 text-center md:text-left">
              <h6 className="text-[11px] text-orange-500 mb-10 font-black uppercase tracking-[0.4em]">Join the list</h6>
              <p className="text-stone-400 text-sm mb-8 font-black leading-relaxed">Drop your email make we dey alert you when fresh gbedu land. No dulling.</p>
              <div className="relative max-w-sm mx-auto md:mx-0">
                <input type="email" placeholder="wetin be your email?" className="w-full bg-white/5 border border-white/10 rounded-[1.5rem] py-5 px-6 text-sm font-bold focus:ring-4 ring-orange-500/20 outline-none transition-all" />
                <button className="absolute right-2.5 top-2.5 bg-white text-stone-950 p-2.5 rounded-xl hover:bg-orange-600 hover:text-white transition-all">
                    <ChevronRight size={24} />
                </button>
              </div>
            </div>
          </div>
          
          <div className="pt-16 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-10">
            <p className="text-stone-600 uppercase text-[10px] tracking-[0.4em] font-black">© 2026 THE PIDGIN BLOG MERCH HOUSE. REPRESENT THE CULTURE GIDIGBA.</p>
            <div className="flex gap-10 text-stone-600 uppercase text-[10px] tracking-[0.4em] font-black">
              <a href="#" className="hover:text-white transition-colors">Privacy</a>
              <a href="#" className="hover:text-white transition-colors">Terms of Steeze</a>
            </div>
          </div>
        </div>
        <AnkaraBorder className="absolute bottom-0 left-0" />
      </footer>

      {/* Cart/Basket Drawer */}
      <AnimatePresence>
        {isCartOpen && (
          <div className="fixed inset-0 z-[200]">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-stone-950/60 backdrop-blur-md" onClick={() => setIsCartOpen(false)} />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 30, stiffness: 200 }} className="absolute right-0 top-0 h-full w-full max-w-2xl bg-white shadow-6xl flex flex-col">
              <AnkaraBorder className="absolute top-0 left-0" />
              <div className="p-12 pt-20 flex items-center justify-between border-b border-stone-100">
                <div>
                  <h2 className="text-5xl uppercase tracking-tighter font-black">{checkoutStep === 'cart' ? 'Your Basket' : 'Delivery Details'}</h2>
                  <p className="text-[11px] text-stone-400 uppercase tracking-[0.3em] mt-2 font-black">Ready to represent the culture?</p>
                </div>
                <button onClick={() => setIsCartOpen(false)} className="p-5 hover:bg-stone-50 rounded-3xl transition-colors"><X size={40} /></button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-12 no-scrollbar">
                {checkoutStep === 'cart' ? (
                  cart.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center text-stone-300">
                      <ShoppingBag size={100} className="mb-10 opacity-20" />
                      <h3 className="text-3xl uppercase tracking-tighter font-black">Basket empty as market after rain</h3>
                      <button onClick={() => setIsCartOpen(false)} className="mt-10 px-10 py-5 bg-stone-950 text-white rounded-[1.5rem] font-black uppercase text-xs">Oya, go shop</button>
                    </div>
                  ) : (
                    <div className="space-y-12">
                      {cart.map((item, i) => (
                        <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }} key={`${item.id}-${item.size}`} className="flex gap-10 group">
                          <div className="w-36 h-48 bg-stone-100 rounded-[2.5rem] overflow-hidden shrink-0 shadow-lg"><img src={item.image} alt={item.name} className="w-full h-full object-cover" /></div>
                          <div className="flex-1 flex flex-col justify-between py-2">
                            <div className="flex justify-between items-start uppercase">
                              <h4 className="text-xl font-black tracking-tight">{item.name}</h4>
                              <button onClick={() => updateQty(item.id, item.size, -item.qty)} className="p-2 hover:bg-red-50 rounded-xl transition-colors text-stone-300 hover:text-red-500"><Trash2 size={24} /></button>
                            </div>
                            <span className="inline-block px-5 py-2 bg-stone-100 rounded-xl text-[10px] uppercase mt-3 text-stone-500 w-fit font-black">Size: {item.size}</span>
                            <div className="flex items-center justify-between mt-6">
                              <div className="flex items-center gap-6 bg-stone-50 rounded-2xl px-6 py-4 border border-stone-100 shadow-inner">
                                <button onClick={() => updateQty(item.id, item.size, -1)} className="hover:text-orange-600"><Minus size={18}/></button>
                                <span className="text-lg font-black">{item.qty}</span>
                                <button onClick={() => updateQty(item.id, item.size, 1)} className="hover:text-orange-600"><Plus size={18}/></button>
                              </div>
                              <span className="text-2xl font-black">₦{(item.price * item.qty).toLocaleString()}</span>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )
                ) : (
                  <div className="space-y-10 uppercase">
                    {[
                      { key: 'fullName', label: 'Who we dey deliver give? (Full Name)', placeholder: 'e.g. Ebuka Merch Lord' },
                      { key: 'email', label: 'Email (for alerts)', placeholder: 'you@example.com', type: 'email' },
                      { key: 'phone', label: 'Phone Number (so we go call you)', placeholder: '+234...' }
                    ].map(field => (
                      <div key={field.key} className="space-y-4">
                        <label className="text-[11px] text-stone-400 tracking-[0.2em] font-black">{field.label}</label>
                        <input 
                          type={field.type || 'text'} 
                          name={field.key} 
                          placeholder={field.placeholder}
                          value={formData[field.key]} 
                          onChange={handleInputChange} 
                          className="w-full p-7 bg-stone-50 border-2 border-transparent rounded-[2rem] focus:bg-white focus:border-orange-500 outline-none font-black text-lg transition-all" 
                        />
                      </div>
                    ))}
                    <div className="space-y-4">
                      <label className="text-[11px] text-stone-400 tracking-[0.2em] font-black">Delivery Address (The exact place)</label>
                      <textarea 
                        name="address" 
                        value={formData.address} 
                        onChange={handleInputChange} 
                        placeholder="Plot 7, Street Name, City, State..."
                        rows="4" 
                        className="w-full p-7 bg-stone-50 border-2 border-transparent rounded-[2rem] focus:bg-white focus:border-orange-500 resize-none outline-none font-black text-lg transition-all" 
                      />
                    </div>
                  </div>
                )}
              </div>
              
              {cart.length > 0 && (
                <div className="p-12 bg-stone-50 border-t border-stone-200 space-y-10">
                  <div className="flex justify-between items-center">
                    <span className="text-stone-400 text-sm uppercase tracking-[0.4em] font-black">Total Gbedu Bill</span>
                    <span className="text-5xl font-black">₦{cartTotal.toLocaleString()}</span>
                  </div>
                  {checkoutStep === 'cart' ? (
                    <button onClick={() => setCheckoutStep('details')} className="w-full bg-stone-950 text-white py-8 rounded-[2.5rem] text-xl uppercase tracking-[0.3em] shadow-3xl font-black active:scale-[0.97] transition-all hover:bg-orange-600">Confirm Details</button>
                  ) : (
                    <div className="flex flex-col gap-4">
                      <button 
                        onClick={payWithPaystack} 
                        disabled={!isFormValid || !paystackLoaded} 
                        className="w-full bg-orange-600 disabled:bg-stone-300 text-white py-8 rounded-[2.5rem] text-xl uppercase tracking-[0.3em] shadow-3xl active:scale-[0.97] transition-all font-black relative overflow-hidden"
                      >
                        {paystackLoaded ? 'Pay Now (No Dulling)' : 'Loading Paystack...'}
                      </button>
                      <button onClick={() => setCheckoutStep('cart')} className="w-full py-4 text-stone-400 uppercase tracking-widest text-[10px] font-black">Back to Basket</button>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Success Modal */}
      <AnimatePresence>
        {orderPlaced && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-blue-950/95 backdrop-blur-2xl">
            <motion.div initial={{ scale: 0.8, y: 100 }} animate={{ scale: 1, y: 0 }} className="bg-white rounded-[5rem] p-20 max-w-2xl w-full text-center shadow-[0_0_100px_rgba(234,88,12,0.3)] relative overflow-hidden">
              <div className="w-40 h-40 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-12 shadow-inner border-8 border-green-100">
                <ShieldCheck size={80} />
              </div>
              <h4 className="text-7xl font-black mb-8 uppercase tracking-tighter">E DON HAPPEN! 🎉</h4>
              <p className="text-stone-500 font-bold mb-14 uppercase text-lg leading-relaxed">Payment successful sharp-sharp. <br /> Check your email, we go call you soon.</p>
              <div className="w-full h-4 bg-stone-100 rounded-full overflow-hidden">
                <motion.div initial={{ x: '-100%' }} animate={{ x: '0%' }} transition={{ duration: 5 }} className="h-full bg-orange-600"></motion.div>
              </div>
              <p className="mt-6 text-[10px] text-stone-400 uppercase tracking-[0.5em] font-black">Hold your steeze, your package dey come.</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chatbot Support */}
      <TPBbot />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&display=swap');
        
        body {
          font-family: 'Space Grotesk', sans-serif;
        }
        
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        
        .shadow-3xl {
          box-shadow: 0 40px 100px -20px rgba(2, 6, 23, 0.4);
        }
        
        .shadow-5xl {
          box-shadow: 0 60px 150px -30px rgba(2, 6, 23, 0.5);
        }

        .shadow-6xl {
          box-shadow: -40px 0 100px -20px rgba(2, 6, 23, 0.3);
        }

        @keyframes float {
          0% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(2deg); }
          100% { transform: translateY(0px) rotate(0deg); }
        }
      `}</style>
    </div>
  );
};

export default App;