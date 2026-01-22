import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  ShoppingBag, Search, X, Plus, Minus, Trash2, ChevronRight, 
  ShieldCheck, Truck, Star, CreditCard, Mail, Phone, MapPin, 
  Instagram, Twitter, Facebook, Tag, MessageSquare, Send, Sparkles,
  Flame, Zap, ShoppingCart, ArrowRight, Menu, Globe
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- CONFIG & CONSTANTS ---
const API_KEY = "AIzaSyB8rw2touAy0S7MMGN4wLq9IgIyCv_erAg"; // Environment handles this
const APP_ID = typeof __app_id !== 'undefined' ? __app_id : 'tpb-merch-house';

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
const GrainOverlay = () => (
  <div className="fixed inset-0 pointer-events-none z-[9999] opacity-[0.03] mix-blend-overlay">
    <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <filter id="noise">
        <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
      </filter>
      <rect width="100%" height="100%" filter="url(#noise)" />
    </svg>
  </div>
);

const KampalaPattern = () => (
  <div className="absolute inset-0 opacity-20 pointer-events-none overflow-hidden">
    <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="dye-smudge">
          <feTurbulence type="fractalNoise" baseFrequency="0.015" numOctaves="4" />
          <feDisplacementMap in="SourceGraphic" scale="30" />
        </filter>
        <radialGradient id="dye-grad" cx="50%" cy="50%" r="70%">
          <stop offset="0%" stopColor="#1e3a8a" />
          <stop offset="100%" stopColor="#020617" />
        </radialGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#dye-grad)" />
      <circle cx="10%" cy="10%" r="300" fill="#2563eb" filter="url(#dye-smudge)" opacity="0.2" />
      <circle cx="90%" cy="90%" r="400" fill="#1d4ed8" filter="url(#dye-smudge)" opacity="0.3" />
    </svg>
  </div>
);

const AnkaraBorder = ({ className = "" }) => (
  <div className={`h-3 w-full ${className} shadow-inner`} style={{
    backgroundImage: `radial-gradient(circle at 10px 10px, #f59e0b 2px, transparent 0), 
                      radial-gradient(circle at 30px 30px, #b45309 4px, transparent 0)`,
    backgroundSize: '40px 40px',
    backgroundColor: '#78350f'
  }} />
);

// --- AI BOT COMPONENT ---
const TPBbot = ({ products }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'bot', text: "Oshey! I be TPBbot, the official Identity Assistant. I dey here to make sure your drip stands gidigba. Wetin you wan know about our premium TPB branded wears?" }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isTyping]);

  const callGemini = async (userQuery) => {
    const systemPrompt = `
      You are TPBbot, the official AI hype-man and customer assistant for "The Pidgin Blog (TPB) Merch House". 
      YOUR VIBE: 
      - Heavy Nigerian Pidgin with a mix of street-smart English. 
      - Funny, witty, relatable, and protective of the brand.
      - Use slangs: "Oshey", "Gbedu", "No dulling", "Gidigba", "Drip", "Identity", "Sho mo".
      - Be clear: We sell PREMIUM BRANDED STREETWEAR (TPB Branded Hoodies, Tees, Caps). 
      - Site theme is Kampala/African vibes, but clothes are modern global streetwear.
      
      PRODUCTS:
      ${products.map(p => `${p.name}: ₦${p.price} - ${p.description}`).join('\n')}
      
      RULES:
      1. One or two sentences max per reply. Stay punchy.
      2. If they ask for "Kampala clothes," explain we are a Merch House for TPB branded streetwear.
      3. Be very helpful with prices and delivery (everywhere in Naija and abroad).
    `;

    let retries = 0;
    while (retries < 3) {
      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${API_KEY}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: `User: ${userQuery}` }] }],
            systemInstruction: { parts: [{ text: systemPrompt }] }
          })
        });
        const data = await response.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text || "E be like my voice crack small. Abeg talk again!";
      } catch (err) {
        retries++;
        await new Promise(res => setTimeout(res, 1000));
      }
    }
    return "Network don show me shege. Check your data or WiFi!";
  };

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;
    const userMsg = input;
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setInput('');
    setIsTyping(true);
    const reply = await callGemini(userMsg);
    setMessages(prev => [...prev, { role: 'bot', text: reply }]);
    setIsTyping(false);
  };

  return (
    <div className="fixed bottom-4 right-4 md:bottom-8 md:right-8 z-[2000]">
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="mb-4 w-[calc(100vw-32px)] sm:w-[380px] h-[500px] bg-white rounded-[2rem] shadow-3xl border border-stone-200 overflow-hidden flex flex-col font-black"
          >
            <div className="p-4 bg-blue-950 text-white flex items-center justify-between border-b-4 border-orange-600">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-600 rounded-xl flex items-center justify-center shadow-lg"><Zap size={20} className="fill-current"/></div>
                <div>
                  <h4 className="text-xs font-black uppercase tracking-tighter italic">TPBbot Assistant</h4>
                  <p className="text-[9px] text-orange-400 font-black uppercase">Active & Smart</p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="p-2"><X size={20}/></button>
            </div>
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar bg-stone-50">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] p-3.5 rounded-[1.5rem] text-[11px] font-bold leading-relaxed shadow-sm ${
                    m.role === 'user' ? 'bg-orange-600 text-white rounded-br-none' : 'bg-white text-stone-900 rounded-bl-none border border-stone-100'
                  }`}>
                    {m.text}
                  </div>
                </div>
              ))}
              {isTyping && <div className="flex justify-start"><div className="bg-white p-3 rounded-2xl shadow-sm border border-stone-100 flex gap-1"><span className="w-1.5 h-1.5 bg-stone-300 rounded-full animate-bounce"></span><span className="w-1.5 h-1.5 bg-stone-300 rounded-full animate-bounce [animation-delay:0.2s]"></span><span className="w-1.5 h-1.5 bg-stone-300 rounded-full animate-bounce [animation-delay:0.4s]"></span></div></div>}
            </div>
            <div className="p-4 bg-white border-t border-stone-100 flex gap-2">
              <input value={input} onChange={(e) => setInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSend()} placeholder="Talk your gbedu..." className="flex-1 bg-stone-100 border-none rounded-xl px-4 py-3 text-[11px] font-black outline-none ring-orange-500/30 focus:ring-4" />
              <button onClick={handleSend} className="bg-stone-950 text-white p-3 rounded-xl hover:bg-orange-600 active:scale-90 transition-all"><Send size={18} /></button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setIsOpen(!isOpen)} className="w-16 h-16 md:w-20 md:h-20 bg-stone-950 text-white rounded-[1.5rem] md:rounded-[2rem] shadow-3xl flex items-center justify-center relative border-4 border-white overflow-hidden group">
        <div className="absolute inset-0 bg-orange-600 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
        <MessageSquare size={28} className="relative z-10" />
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

  const products = [
    { id: 1, name: "TPB 'Identity' Hoodie", price: 32000, category: "Hoodies", image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&q=80&w=800", description: "Heavyweight premium cotton with signature TPB embroidery. Branded for the elite street culture.", hot: true },
    { id: 2, name: "TPB 'Lamba' Shorts", price: 18000, category: "Shorts", image: "https://images.unsplash.com/photo-1591195853828-11db59a44f6b?auto=format&fit=crop&q=80&w=800", description: "Street-fit shorts with TPB rubberized patch. Identity flex in every step." },
    { id: 3, name: "TPB 'Wetin Dey' Tee", price: 14500, category: "Shirts", image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&q=80&w=800", description: "Premium cotton tee with high-density 'Identity' print. No fading, just pure vibes." },
    { id: 4, name: "TPB Mesh Trucker Cap", price: 9000, category: "Caps", image: "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&q=80&w=800", description: "Official TPB Merch headwear. Structured mesh design for max street style." },
    { id: 5, name: "TPB Street Joggers", price: 25000, category: "Shorts", image: "https://images.unsplash.com/photo-1552902865-b72c031ac5ea?auto=format&fit=crop&q=80&w=800", description: "Heavy-fleece joggers with TPB side-seam branding. Comfort meets street smarts." },
    { id: 6, name: "TPB 'Gbedu' Tote", price: 6500, category: "Accessories", image: "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&q=80&w=800", description: "Official TPB branded carry-all. Durable canvas for your everyday runs." }
  ];

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesCategory = activeCategory === 'All' || p.category === activeCategory;
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, searchQuery]);

  const addToCart = (product) => {
    const size = selectedSizes[product.id];
    if (!size && product.category !== 'Accessories' && product.category !== 'Caps') return;
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
      callback: () => { setOrderPlaced(true); setCart([]); setTimeout(() => { setOrderPlaced(false); setIsCartOpen(false); }, 5000); }
    });
    handler.openIframe();
  };

  return (
    <div className="min-h-screen bg-[#fcfcfb] text-stone-900 font-black selection:bg-orange-600 selection:text-white">
      <GrainOverlay />
      <AnkaraBorder className="fixed top-0 z-[100]" />
      
      {/* Mobile Navigation */}
      <nav className="sticky top-2 z-50 mx-2 md:mx-4 bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-stone-200 mt-2 h-16 md:h-24 flex items-center justify-between px-4 md:px-8">
        <div className="flex items-center gap-2 md:gap-4">
          <div className="w-10 h-10 md:w-14 md:h-14 bg-blue-900 text-white flex items-center justify-center font-black rounded-xl rotate-3 shadow-2xl relative overflow-hidden group">
            <div className="absolute inset-0 opacity-40 bg-[url('https://www.transparenttextures.com/patterns/batik-fabric.png')]"></div>
            <span className="relative z-10 text-lg md:text-2xl italic">TPB</span>
          </div>
          <div>
            <h1 className="font-black text-sm md:text-2xl tracking-tighter leading-none uppercase italic underline decoration-orange-600 decoration-2 md:decoration-4">Merch House</h1>
            <span className="text-[8px] md:text-[11px] font-black text-orange-600 tracking-widest uppercase">Official Identity Wear</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2 md:gap-4">
          <div className="hidden sm:flex relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 w-4 h-4" />
            <input type="text" placeholder="Search drip..." className="bg-stone-100 rounded-xl pl-10 pr-4 py-2 text-[10px] outline-none border-none ring-orange-500/20 focus:ring-4 w-32 md:w-48 transition-all" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
          <button onClick={() => setIsCartOpen(true)} className="flex items-center gap-2 bg-stone-950 text-white px-4 md:px-8 py-2.5 md:py-4 rounded-xl md:rounded-2xl hover:bg-orange-600 transition-all shadow-xl active:scale-95 group relative">
            <ShoppingCart size={18} />
            <span className="hidden md:inline uppercase text-[10px] tracking-[0.2em]">Basket</span>
            {cart.length > 0 && <span className="bg-orange-600 text-white text-[9px] w-5 h-5 rounded-md flex items-center justify-center font-black absolute -top-1 -right-1 border-2 border-white shadow-lg">{cart.reduce((a, b) => a + b.qty, 0)}</span>}
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="px-2 md:px-4 pt-4 md:pt-8 pb-12 overflow-hidden">
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="max-w-7xl mx-auto rounded-[2rem] md:rounded-[4rem] overflow-hidden relative shadow-3xl bg-blue-950 min-h-[450px] md:min-h-[600px] flex items-center px-6 md:px-20 py-12">
          <KampalaPattern />
          <div className="relative z-10 text-white max-w-4xl">
            <div className="inline-flex items-center gap-2 bg-orange-600 text-white px-4 py-2 rounded-xl shadow-xl text-[10px] font-black mb-6 md:mb-10 tracking-[0.2em] uppercase italic">
              <Flame size={16} className="animate-pulse" /> Official TPB Identity Drop
            </div>
            <h2 className="text-5xl md:text-8xl lg:text-9xl font-black leading-[0.9] mb-8 uppercase tracking-tighter italic">
              WE NO <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-white to-orange-600">DULL</span> <br />
              FOR HERE
            </h2>
            <p className="text-base md:text-2xl text-blue-100/70 mb-10 md:mb-12 max-w-xl font-black tracking-tight leading-tight uppercase italic">
              Premium Streetwear branded for the identity. Gidigba quality, zero stories.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <button className="bg-white text-blue-950 px-8 md:px-12 py-4 md:py-6 rounded-2xl md:rounded-3xl font-black uppercase text-[10px] md:text-xs tracking-[0.3em] hover:bg-orange-600 hover:text-white transition-all shadow-2xl active:scale-95 text-center">Shop Now</button>
              <button className="bg-blue-900/40 backdrop-blur-md border-2 border-white/10 text-white px-8 md:px-12 py-4 md:py-6 rounded-2xl md:rounded-3xl font-black uppercase text-[10px] md:text-xs tracking-[0.3em] hover:bg-white/10 transition-all text-center">About TPB</button>
            </div>
          </div>
          <div className="hidden xl:block absolute right-20 top-20 w-[400px] h-[550px] rotate-6 border-[12px] border-white/10 rounded-[3rem] overflow-hidden shadow-5xl">
            <img src="https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&q=80&w=800" className="w-full h-full object-cover" alt="Featured Drop" />
          </div>
        </motion.div>
      </header>

      {/* Product Grid */}
      <main className="max-w-7xl mx-auto px-4 py-12 md:py-24">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-16">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="h-1 w-12 bg-orange-600"></div>
              <span className="text-orange-600 text-[10px] font-black uppercase tracking-[0.4em]">Inventory</span>
            </div>
            <h3 className="text-4xl md:text-7xl font-black text-stone-950 tracking-tighter uppercase italic">The Drip List</h3>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-4 no-scrollbar -mx-4 px-4 lg:mx-0 lg:px-0">
            {["All", "Hoodies", "Shirts", "Caps", "Shorts"].map(cat => (
              <button key={cat} onClick={() => setActiveCategory(cat)} className={`px-8 py-3.5 rounded-2xl font-black text-[9px] uppercase tracking-[0.2em] transition-all whitespace-nowrap shadow-xl border-2 ${activeCategory === cat ? 'bg-orange-600 text-white border-orange-600 translate-y-[-4px]' : 'bg-white text-stone-400 border-stone-50 hover:border-orange-200'}`}>{cat}</button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-12">
          <AnimatePresence mode='popLayout'>
            {filteredProducts.map((product) => (
              <motion.div key={product.id} layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="group bg-white rounded-[2.5rem] overflow-hidden border border-stone-100 hover:border-orange-400 transition-all duration-500 hover:shadow-3xl p-3 md:p-4 flex flex-col">
                <div className="aspect-[1/1.2] bg-stone-50 rounded-[1.8rem] overflow-hidden relative shadow-inner">
                  <motion.img whileHover={{ scale: 1.05 }} transition={{ duration: 0.6 }} src={product.image} alt={product.name} className="w-full h-full object-cover" />
                  <div className="absolute top-4 left-4 flex gap-2">
                    <span className="bg-black/80 backdrop-blur-md text-white px-4 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-widest border border-white/10">TPB {product.category}</span>
                    {product.hot && <span className="bg-orange-600 text-white px-4 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-widest animate-pulse shadow-lg">HOT 🔥</span>}
                  </div>
                </div>
                <div className="p-6 md:p-8 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-4 gap-2">
                    <h4 className="text-xl md:text-2xl font-black leading-none uppercase italic group-hover:text-orange-600 transition-colors tracking-tighter">{product.name}</h4>
                    <span className="text-lg md:text-xl font-black text-stone-950 italic whitespace-nowrap">₦{product.price.toLocaleString()}</span>
                  </div>
                  <p className="text-stone-500 text-[10px] md:text-xs mb-8 line-clamp-2 leading-relaxed font-bold uppercase tracking-tight">{product.description}</p>
                  
                  {(product.category !== 'Caps' && product.category !== 'Accessories') && (
                    <div className="mb-8">
                      <p className="text-[9px] font-black uppercase text-stone-400 mb-3 tracking-[0.2em]">Select Size:</p>
                      <div className="flex flex-wrap gap-2">
                        {['S', 'M', 'L', 'XL', 'XXL'].map(size => (
                          <button key={size} onClick={() => setSelectedSizes(prev => ({ ...prev, [product.id]: size }))} className={`w-10 h-10 rounded-xl border-2 flex items-center justify-center font-black text-[10px] transition-all ${selectedSizes[product.id] === size ? 'bg-stone-900 border-stone-900 text-white shadow-xl scale-110' : 'bg-white border-stone-100 text-stone-400 hover:border-orange-200'}`}>{size}</button>
                        ))}
                      </div>
                    </div>
                  )}
                  <button onClick={() => addToCart(product)} className={`mt-auto w-full py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all shadow-xl italic ${(!selectedSizes[product.id] && product.category !== 'Caps' && product.category !== 'Accessories') ? 'bg-stone-100 text-stone-300 cursor-not-allowed' : 'bg-stone-950 text-white hover:bg-orange-600 active:scale-[0.98]'}`}>Add To Basket</button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </main>

      {/* Trust Section */}
      <section className="max-w-7xl mx-auto px-4 mb-24">
        <div className="bg-blue-950 rounded-[3rem] md:rounded-[5rem] relative overflow-hidden shadow-3xl p-10 md:p-24 border-[10px] md:border-[20px] border-white">
          <KampalaPattern />
          <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-16">
            <div className="text-center md:text-left flex flex-col items-center md:items-start group">
              <div className="w-16 h-16 md:w-20 md:h-20 bg-orange-600 text-white rounded-[1.5rem] flex items-center justify-center mb-6 shadow-2xl transition-transform group-hover:rotate-12"><Truck size={32} /></div>
              <h5 className="text-2xl md:text-3xl text-white font-black mb-3 uppercase italic tracking-tighter leading-none">Global Delivery</h5>
              <p className="text-blue-100/50 font-black text-[10px] md:text-xs leading-relaxed uppercase italic">Lagos to London, Abuja to Atlanta. We go reach you gidigba. Fast shipping always.</p>
            </div>
            <div className="text-center md:text-left flex flex-col items-center md:items-start group">
              <div className="w-16 h-16 md:w-20 md:h-20 bg-blue-600 text-white rounded-[1.5rem] flex items-center justify-center mb-6 shadow-2xl transition-transform group-hover:rotate-[-12deg]"><ShieldCheck size={32} /></div>
              <h5 className="text-2xl md:text-3xl text-white font-black mb-3 uppercase italic tracking-tighter leading-none">Official Merch</h5>
              <p className="text-blue-100/50 font-black text-[10px] md:text-xs leading-relaxed uppercase italic">Original TPB Branded. High-grade stitching. No be generic gbedu, na real identity.</p>
            </div>
            <div className="text-center md:text-left flex flex-col items-center md:items-start group">
              <div className="w-16 h-16 md:w-20 md:h-20 bg-green-600 text-white rounded-[1.5rem] flex items-center justify-center mb-6 shadow-2xl transition-transform group-hover:scale-110"><Star size={32} /></div>
              <h5 className="text-2xl md:text-3xl text-white font-black mb-3 uppercase italic tracking-tighter leading-none">For The Culture</h5>
              <p className="text-blue-100/50 font-black text-[10px] md:text-xs leading-relaxed uppercase italic">Every buy supports the Pidgin community. Wear the brand, support the voice.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-stone-950 text-white pt-24 pb-12 relative overflow-hidden px-4">
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 mb-20 text-center lg:text-left">
            <div className="lg:col-span-5">
              <div className="flex items-center gap-3 mb-8 justify-center lg:justify-start">
                <div className="w-12 h-12 bg-white text-stone-950 flex items-center justify-center font-black rounded-xl text-xl rotate-3 italic">TPB</div>
                <h6 className="font-black text-3xl uppercase tracking-tighter italic underline decoration-orange-600 decoration-4">Merch House</h6>
              </div>
              <p className="text-stone-400 text-base md:text-lg font-black leading-relaxed max-w-md mx-auto lg:mx-0 mb-10 uppercase italic">Official streetwear for The Pidgin Blog. Represent your identity with sense and style.</p>
              <div className="flex gap-4 justify-center lg:justify-start">
                {[Instagram, Twitter, Facebook, Globe].map((Icon, i) => (
                  <motion.a key={i} href="#" whileHover={{ y: -5, scale: 1.1 }} className="w-12 h-12 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center hover:bg-orange-600 transition-all shadow-xl"><Icon size={20} /></motion.a>
                ))}
              </div>
            </div>
            <div className="lg:col-span-4">
              <h6 className="text-[10px] text-orange-500 mb-8 font-black uppercase tracking-[0.4em]">Connect Gidigba</h6>
              <ul className="space-y-4 text-stone-400 font-black uppercase text-[10px] italic tracking-widest">
                <li className="flex items-center justify-center lg:justify-start gap-3"><Mail size={16} className="text-orange-600" /> contact@thepidginblog.com</li>
                <li className="flex items-center justify-center lg:justify-start gap-3"><Phone size={16} className="text-orange-600" /> +234 (0) TPB DRIP</li>
                <li className="flex items-center justify-center lg:justify-start gap-3"><MapPin size={16} className="text-orange-600" /> Lagos Headquarters</li>
              </ul>
            </div>
            <div className="lg:col-span-3">
              <h6 className="text-[10px] text-orange-500 mb-8 font-black uppercase tracking-[0.4em]">The Alert List</h6>
              <p className="text-stone-400 text-[10px] font-black mb-6 uppercase tracking-tight italic">Drop your email make we notify you when new identity drop.</p>
              <div className="relative max-w-sm mx-auto lg:mx-0">
                <input type="email" placeholder="EMAIL ADDRESS..." className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-[10px] font-black focus:border-orange-600 outline-none uppercase" />
                <button className="absolute right-2 top-2 bg-white text-stone-950 p-2 rounded-xl hover:bg-orange-600 hover:text-white transition-all"><ArrowRight size={20} /></button>
              </div>
            </div>
          </div>
          <div className="pt-10 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6 text-[8px] md:text-[10px] text-stone-600 font-black uppercase tracking-[0.4em] italic">
            <p>© 2026 THE PIDGIN BLOG MERCH HOUSE. ALL RIGHTS RESERVED.</p>
            <div className="flex gap-8">
              <a href="#" className="hover:text-white transition-colors">Privacy</a>
              <a href="#" className="hover:text-white transition-colors">Terms</a>
            </div>
          </div>
        </div>
        <AnkaraBorder className="absolute bottom-0 left-0" />
      </footer>

      {/* Cart Drawer */}
      <AnimatePresence>
        {isCartOpen && (
          <div className="fixed inset-0 z-[3000]">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-stone-950/80 backdrop-blur-md" onClick={() => setIsCartOpen(false)} />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 35, stiffness: 250 }} className="absolute right-0 top-0 h-full w-full max-w-2xl bg-white shadow-[-50px_0_100px_rgba(0,0,0,0.5)] flex flex-col border-l-4 md:border-l-8 border-orange-600">
              <AnkaraBorder className="absolute top-0 left-0" />
              <div className="p-8 pt-16 md:p-12 md:pt-20 flex items-center justify-between bg-stone-50 border-b border-stone-100">
                <div>
                  <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter italic leading-none">{checkoutStep === 'cart' ? 'The Basket' : 'Checkout'}</h2>
                  <p className="text-[9px] md:text-[11px] text-stone-400 uppercase tracking-[0.3em] mt-1 font-black">No dulling, verify your identity</p>
                </div>
                <button onClick={() => setIsCartOpen(false)} className="p-3 bg-white rounded-2xl shadow-xl hover:rotate-90 transition-transform"><X size={28} /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-6 md:p-12 no-scrollbar">
                {checkoutStep === 'cart' ? (
                  cart.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center opacity-10 uppercase grayscale font-black"><ShoppingBag size={100} className="mb-6" /><h3 className="text-2xl italic tracking-tighter">Basket Empty</h3></div>
                  ) : (
                    <div className="space-y-8">
                      {cart.map((item, i) => (
                        <motion.div layout initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} key={`${item.id}-${item.size}`} className="flex gap-4 md:gap-8 group bg-stone-50 p-4 md:p-6 rounded-[2rem] border border-stone-100">
                          <div className="w-24 h-32 md:w-32 md:h-40 bg-white rounded-2xl overflow-hidden shrink-0 shadow-xl border-4 border-white"><img src={item.image} alt={item.name} className="w-full h-full object-cover" /></div>
                          <div className="flex-1 flex flex-col justify-between py-1">
                            <div className="flex justify-between items-start">
                              <div><h4 className="text-base md:text-2xl font-black uppercase italic tracking-tighter leading-none mb-1">{item.name}</h4><span className="bg-orange-600 text-white px-3 py-1 rounded-lg text-[8px] uppercase tracking-widest font-black">SIZE: {item.size}</span></div>
                              <button onClick={() => updateQty(item.id, item.size, -item.qty)} className="text-stone-300 hover:text-red-500 transition-colors"><Trash2 size={18} /></button>
                            </div>
                            <div className="flex items-center justify-between mt-4">
                              <div className="flex items-center gap-4 bg-white rounded-xl px-4 py-2 border border-stone-100 shadow-sm"><button onClick={() => updateQty(item.id, item.size, -1)} className="hover:text-orange-600"><Minus size={14}/></button><span className="text-sm font-black italic">{item.qty}</span><button onClick={() => updateQty(item.id, item.size, 1)} className="hover:text-orange-600"><Plus size={14}/></button></div>
                              <span className="text-lg md:text-2xl font-black italic">₦{(item.price * item.qty).toLocaleString()}</span>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )
                ) : (
                  <div className="space-y-6">
                    {['fullName', 'email', 'phone'].map(field => (
                      <div key={field}><label className="text-[10px] text-stone-400 tracking-[0.3em] font-black uppercase mb-2 block italic">{field === 'fullName' ? 'Full Legal Name' : field === 'email' ? 'Active Email' : 'Phone Line'}</label><input type={field === 'email' ? 'email' : 'text'} name={field} placeholder={`ENTER ${field}...`} value={formData[field]} onChange={handleInputChange} className="w-full p-5 bg-stone-50 border-4 border-stone-100 rounded-2xl focus:border-orange-500 outline-none font-black uppercase text-xs transition-all" /></div>
                    ))}
                    <div><label className="text-[10px] text-stone-400 tracking-[0.3em] font-black uppercase mb-2 block italic">Delivery Base (Address)</label><textarea name="address" value={formData.address} onChange={handleInputChange} placeholder="WHERE WE DEY DROP AM?..." rows="3" className="w-full p-5 bg-stone-50 border-4 border-stone-100 rounded-[1.5rem] focus:border-orange-500 resize-none outline-none font-black uppercase text-xs transition-all" /></div>
                  </div>
                )}
              </div>
              {cart.length > 0 && (
                <div className="p-8 md:p-12 bg-stone-950 text-white rounded-t-[3rem] md:rounded-t-[4rem] space-y-6 md:space-y-8 shadow-3xl">
                  <div className="flex justify-between items-center"><span className="text-stone-400 text-xs uppercase tracking-[0.4em] font-black">Total Bill</span><span className="text-3xl md:text-5xl font-black italic text-orange-500 underline decoration-4 underline-offset-8">₦{cartTotal.toLocaleString()}</span></div>
                  {checkoutStep === 'cart' ? (
                    <button onClick={() => setCheckoutStep('details')} className="w-full bg-white text-stone-950 py-6 md:py-8 rounded-[2rem] md:rounded-[2.5rem] text-[10px] md:text-xs font-black uppercase tracking-[0.3em] shadow-2xl hover:bg-orange-600 hover:text-white transition-all flex items-center justify-center gap-3 italic">Proceed To Details <ChevronRight size={20}/></button>
                  ) : (
                    <div className="flex flex-col gap-4">
                      <button onClick={payWithPaystack} disabled={!isFormValid || !paystackLoaded} className="w-full bg-orange-600 disabled:bg-stone-800 disabled:text-stone-600 text-white py-6 md:py-8 rounded-[2rem] md:rounded-[2.5rem] text-[10px] md:text-xs font-black uppercase tracking-[0.3em] shadow-3xl active:scale-95 transition-all italic">Pay Gidigba (No Dulling)</button>
                      <button onClick={() => setCheckoutStep('cart')} className="text-[9px] text-stone-500 uppercase font-black tracking-[0.3em] hover:text-white transition-colors underline italic text-center">Go Back To Basket</button>
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
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[5000] flex items-center justify-center p-4 bg-blue-950/98 backdrop-blur-3xl">
            <motion.div initial={{ scale: 0.8, rotate: -3 }} animate={{ scale: 1, rotate: 0 }} className="bg-white rounded-[3rem] md:rounded-[5rem] p-10 md:p-20 max-w-xl w-full text-center shadow-5xl border-[16px] border-orange-600/10 relative overflow-hidden">
              <div className="w-24 h-24 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-10 shadow-inner"><ShieldCheck size={48} /></div>
              <h4 className="text-4xl md:text-6xl font-black mb-6 uppercase tracking-tighter italic text-stone-950 leading-none">ORDER PLACED! 🎉</h4>
              <p className="text-stone-500 font-black mb-10 uppercase text-[10px] md:text-xs tracking-[0.2em] leading-relaxed italic">Identity confirmed. Check your email, receipt don land. We dey come reach you sharp-sharp!</p>
              <div className="w-full h-3 bg-stone-100 rounded-full overflow-hidden border border-stone-50"><motion.div initial={{ width: '0%' }} animate={{ width: '100%' }} transition={{ duration: 5 }} className="h-full bg-orange-600"></motion.div></div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bot */}
      <TPBbot products={products} />

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        @import url('https://fonts.googleapis.com/css2?family=Archivo+Black&display=swap');
        body { font-family: 'Archivo Black', sans-serif; letter-spacing: -0.02em; -webkit-font-smoothing: antialiased; }
        h1, h2, h3, h4, h5, h6 { letter-spacing: -0.04em; }
      `}</style>
    </div>
  );
};

export default App;