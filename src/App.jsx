import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  ShoppingBag, Search, X, Plus, Minus, Trash2, ChevronRight, 
  ShieldCheck, Truck, CreditCard, MapPin, User, Phone, 
  Mail, ArrowLeft, Tag, Star, MessageSquare, Send, Loader2,
  Instagram, Twitter, Facebook, Youtube, ArrowUpRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- GEMINI API CONFIGURATION ---
// We use a helper function to safely get the key and prevent build-time errors
const getApiKey = () => {
  const hardcodedKey = "AIzaSyCVzKqa-jDzoghZj-ec2eb-YwPWZ7hz2wY";
  try {
    // Check for Vercel/Vite environment variables first
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_GEMINI_API_KEY) {
      return import.meta.env.VITE_GEMINI_API_KEY;
    }
  } catch (e) {
    // Fail silently to hardcoded key
  }
  return hardcodedKey;
};

const apiKey = getApiKey();

/**
 * Robust API caller with exponential backoff.
 * Retries up to 5 times with delays of 1s, 2s, 4s, 8s, 16s.
 */
const callGeminiWithRetry = async (prompt, systemInstruction) => {
  if (!apiKey) return "Omo, I never see API key. Check your settings!";
  
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
  
  const payload = {
    contents: [{ parts: [{ text: prompt }] }],
    systemInstruction: { parts: [{ text: systemInstruction }] }
  };

  let delay = 1000;
  for (let i = 0; i <= 5; i++) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        // If we get a 403 or similar, it's an API key issue
        if (response.status === 403 || response.status === 401) {
          return "Omo, your API key no dey work or e don expire. Check Vercel settings.";
        }
        // Retry on 429 (rate limit) or 500s
        if (response.status === 429 || response.status >= 500) {
          throw new Error('Retryable error');
        }
        return `E be like say server dey vex (${response.status}). Abeg try again.`;
      }

      const result = await response.json();
      const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
      return text || "E be like say I loss for words small, abeg talk another one.";
    } catch (error) {
      if (i === 5) return "Network trip bad well-well. Abeg refresh the page or wait small.";
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 2;
    }
  }
};

const CHAT_SYSTEM_PROMPT = `You be the official TPB Merch House assistant. 
Your name na "TPB Merch Guy". You be Lagos street-smart, funny, and 100% fluent for Nigerian Pidgin. 
Strictly talk in Nigerian Pidgin only. No talk big grammar.

Items wey we get for shop:
1. TPB 'Signature' Hoodie - ₦32,000 (Heavyweight cotton, Kampala accents)
2. TPB 'Lamba' Shorts - ₦18,000 (Breathable, Lagos heat-ready)
3. TPB 'Wetin Dey' Tee - ₦14,500 (Premium black cotton, no-fade print)
4. TPB Mesh Trucker Cap - ₦9,000 (Script embroidery)
5. TPB Street Joggers - ₦25,000 (Slim-fit, Ankara pockets)
6. TPB Branding Tote - ₦6,500 (Heavy canvas)

Sizes: We get from S to XXL for shirts, hoodies, and joggers.
Delivery: We deliver everywhere (Lagos, Abuja, Overseas). Sharp delivery, no stories.

Your job: Help customers find wetin fit them, explain the quality, and vibe with them. 
If they ask anything outside merch or TPB, find way bring am back to the clothes politely.`;

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

// --- ANIMATION VARIANTS ---
const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] }
};

const staggerContainer = {
  animate: { transition: { staggerChildren: 0.1 } }
};

const KampalaPattern = () => (
  <div className="absolute inset-0 opacity-30 pointer-events-none overflow-hidden">
    <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="dye-smudge">
          <feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves="3" />
          <feDisplacementMap in="SourceGraphic" scale="20" />
        </filter>
        <radialGradient id="dye-grad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#1e3a8a" />
          <stop offset="100%" stopColor="#172554" />
        </radialGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#dye-grad)" />
      <circle cx="20%" cy="30%" r="150" fill="#2563eb" filter="url(#dye-smudge)" opacity="0.3" />
      <circle cx="80%" cy="70%" r="200" fill="#1d4ed8" filter="url(#dye-smudge)" opacity="0.4" />
    </svg>
  </div>
);

const AnkaraBorder = ({ className = "" }) => (
  <div className={`h-4 w-full ${className} shadow-sm`} style={{
    backgroundImage: `radial-gradient(circle at 10px 10px, #f59e0b 2px, transparent 0), 
                     radial-gradient(circle at 30px 30px, #b45309 4px, transparent 0)`,
    backgroundSize: '40px 40px',
    backgroundColor: '#78350f'
  }} />
);

const App = () => {
  const paystackLoaded = usePaystack();
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState('cart');
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [selectedSizes, setSelectedSizes] = useState({}); 
  
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { role: 'assistant', text: "Oshey! Welcome to TPB Merch House. I be the TPB Merch Guy. How I fit help you represent the culture today?" }
  ]);
  const [userInput, setUserInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef(null);

  const [formData, setFormData] = useState({ fullName: '', email: '', phone: '', address: '' });

  const categories = ["All", "Shorts", "Shirts", "Hoodies", "Caps"];
  const availableSizes = ['S', 'M', 'L', 'XL', 'XXL'];

  const products = [
    { id: 1, name: "TPB 'Signature' Hoodie", price: 32000, category: "Hoodies", image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&q=80&w=600", description: "Heavyweight cotton with TPB logo embroidery. Kampala dye accents." },
    { id: 2, name: "TPB 'Lamba' Shorts", price: 18000, category: "Shorts", image: "https://images.unsplash.com/photo-1591195853828-11db59a44f6b?auto=format&fit=crop&q=80&w=600", description: "Breathable shorts for the Lagos heat. TPB rubber patch." },
    { id: 3, name: "TPB 'Wetin Dey' Tee", price: 14500, category: "Shirts", image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&q=80&w=600", description: "Premium black cotton. No go fade." },
    { id: 4, name: "TPB Mesh Trucker Cap", price: 9000, category: "Caps", image: "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&q=80&w=600", description: "Structured 5-panel cap with script embroidery." },
    { id: 5, name: "TPB Street Joggers", price: 25000, category: "Shorts", image: "https://images.unsplash.com/photo-1552902865-b72c031ac5ea?auto=format&fit=crop&q=80&w=600", description: "Slim-fit joggers with Ankara pocket detailing." },
    { id: 6, name: "TPB Branding Tote", price: 6500, category: "Accessories", image: "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&q=80&w=600", description: "Heavy canvas material for your daily market run." }
  ];

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesCategory = activeCategory === 'All' || p.category === activeCategory;
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, searchQuery]);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chatMessages]);

  const setSize = (productId, size) => {
    setSelectedSizes(prev => ({ ...prev, [productId]: size }));
  };

  const addToCart = (product) => {
    const size = selectedSizes[product.id];
    if (!size && product.category !== 'Accessories' && product.category !== 'Caps') return;

    setCart(prev => {
      const itemKey = `${product.id}-${size || 'N/A'}`;
      const exists = prev.find(item => `${item.id}-${item.size}` === itemKey);
      if (exists) {
        return prev.map(item => `${item.id}-${item.size}` === itemKey ? { ...item, qty: item.qty + 1 } : item);
      }
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

  const cartTotal = cart.reduce((acc, item) => acc + (item.price * item.qty), 0);

  const sendMessage = async () => {
    if (!userInput.trim()) return;
    const currentInput = userInput;
    setChatMessages(prev => [...prev, { role: 'user', text: currentInput }]);
    setUserInput("");
    setIsTyping(true);

    const botResponse = await callGeminiWithRetry(currentInput, CHAT_SYSTEM_PROMPT);
    setChatMessages(prev => [...prev, { role: 'assistant', text: botResponse }]);
    setIsTyping(false);
  };

  const payWithPaystack = () => {
    if (!paystackLoaded) return;
    const handler = window.PaystackPop.setup({
      key: 'pk_live_80cab3e2f524cc53e4c88c49fe1f0fccebcb9b23',
      email: formData.email,
      amount: cartTotal * 100,
      currency: "NGN",
      ref: 'TPB_' + Date.now(),
      metadata: {
        custom_fields: [
          { display_name: "Items", variable_name: "items", value: cart.map(i => `${i.name} (${i.size}) x${i.qty}`).join(', ') },
          { display_name: "Address", variable_name: "address", value: formData.address }
        ]
      },
      callback: () => {
        setOrderPlaced(true);
        setCart([]);
        setTimeout(() => { setOrderPlaced(false); setIsCartOpen(false); }, 5000);
      }
    });
    handler.openIframe();
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const isFormValid = formData.fullName && formData.email && formData.phone && formData.address;

  return (
    <div className="min-h-screen bg-[#fafaf9] text-stone-900 font-sans pb-0 overflow-x-hidden">
      <AnkaraBorder className="fixed top-0 z-[60]" />
      
      {/* Navigation */}
      <nav className="sticky top-4 z-50 mx-4 bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border border-stone-200 mt-4">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-900 text-white flex items-center justify-center font-black rounded-xl rotate-3 shadow-lg relative overflow-hidden group">
              <div className="absolute inset-0 opacity-40 bg-[url('https://www.transparenttextures.com/patterns/batik-fabric.png')]"></div>
              <span className="relative z-10 text-xl">TPB</span>
            </div>
            <div>
              <h1 className="font-black text-xl tracking-tighter leading-none uppercase">Merch House</h1>
              <span className="text-[10px] font-bold text-orange-600 tracking-widest uppercase">The Pidgin Blog</span>
            </div>
          </motion.div>

          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsCartOpen(true)} 
            className="flex items-center gap-2 bg-stone-950 text-white px-5 py-3 rounded-xl font-bold hover:bg-orange-600 transition-all shadow-lg"
          >
            <ShoppingBag className="w-5 h-5" />
            <span className="hidden sm:inline">Basket</span>
            {cart.length > 0 && <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="bg-white text-stone-900 text-xs w-6 h-6 rounded-full flex items-center justify-center font-black ml-1">{cart.reduce((a, b) => a + b.qty, 0)}</motion.span>}
          </motion.button>
        </div>
      </nav>

      {/* Hero */}
      <header className="relative py-20 px-4 mt-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="max-w-7xl mx-auto rounded-[3.5rem] overflow-hidden relative shadow-2xl bg-blue-950 min-h-[500px] flex items-center"
        >
          <KampalaPattern />
          <div className="relative z-10 p-8 md:p-24 text-white max-w-4xl">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="inline-flex items-center gap-2 bg-orange-500/20 text-orange-400 px-5 py-2 rounded-full border border-orange-500/30 text-[10px] font-black mb-8 tracking-[0.2em] uppercase">
              <Tag className="w-4 h-4" /> 2026 Collection Drop
            </motion.div>
            <h2 className="text-6xl md:text-9xl font-black leading-[0.85] mb-8 uppercase tracking-tighter">
              DRESS THE <br />
              <motion.span 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 1 }}
                className="text-transparent bg-clip-text bg-gradient-to-br from-orange-400 via-yellow-200 to-orange-600"
              >
                IDENTITY
              </motion.span>
            </h2>
            <p className="text-xl md:text-3xl text-blue-100/70 mb-12 max-w-2xl font-medium tracking-tight">Pure Kampala vibes, Ankara details, and that TPB energy wey no dey finish.</p>
            <motion.button whileHover={{ x: 10 }} className="flex items-center gap-3 text-orange-400 font-black text-xl uppercase tracking-widest group">
              Explore Drops <ChevronRight className="group-hover:translate-x-1 transition-transform" />
            </motion.button>
          </div>
        </motion.div>
      </header>

      {/* Products Section */}
      <main className="max-w-7xl mx-auto px-4 py-20">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
            <h3 className="text-5xl font-black text-stone-900 mb-3 uppercase tracking-tighter">Fresh Gbedu</h3>
            <p className="text-stone-400 font-black uppercase tracking-[0.2em] text-[10px]">Pick your size and represent</p>
          </motion.div>
          
          <div className="flex items-center gap-2 overflow-x-auto pb-4 no-scrollbar">
            {categories.map(cat => (
              <motion.button 
                whileTap={{ scale: 0.95 }}
                key={cat} 
                onClick={() => setActiveCategory(cat)} 
                className={`px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${activeCategory === cat ? 'bg-orange-600 text-white shadow-xl' : 'bg-white text-stone-400 border border-stone-100'}`}
              >
                {cat}
              </motion.button>
            ))}
          </div>
        </div>

        <motion.div layout variants={staggerContainer} initial="initial" whileInView="animate" viewport={{ once: true }} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-12">
          <AnimatePresence mode='popLayout'>
            {filteredProducts.map((product) => (
              <motion.div 
                key={product.id}
                layout
                variants={fadeInUp}
                className="group flex flex-col h-full bg-white rounded-[3rem] overflow-hidden border border-stone-100 hover:border-orange-300 transition-all duration-500 hover:shadow-3xl"
              >
                <div className="aspect-[4/5] bg-stone-50 overflow-hidden relative">
                  <motion.img 
                    whileHover={{ scale: 1.08 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    src={product.image} 
                    alt={product.name} 
                    className="w-full h-full object-cover" 
                  />
                  <div className="absolute top-8 left-8">
                    <span className="bg-white/95 backdrop-blur-md px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest text-blue-950 shadow-sm border border-stone-100">
                      {product.category}
                    </span>
                  </div>
                </div>

                <div className="p-10 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-4">
                    <h4 className="text-2xl font-black leading-tight uppercase group-hover:text-orange-600 transition-colors">{product.name}</h4>
                    <span className="text-xl font-black text-stone-950">₦{product.price.toLocaleString()}</span>
                  </div>
                  
                  <p className="text-stone-500 text-sm mb-8 font-medium line-clamp-2 leading-relaxed">{product.description}</p>
                  
                  {(product.category !== 'Caps' && product.category !== 'Accessories') && (
                    <div className="mb-8">
                      <p className="text-[10px] font-black uppercase tracking-widest text-stone-400 mb-4">Select Size:</p>
                      <div className="flex flex-wrap gap-2">
                        {availableSizes.map(size => (
                          <motion.button
                            key={size}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => setSize(product.id, size)}
                            className={`w-10 h-10 rounded-xl border-2 flex items-center justify-center font-black text-xs transition-all ${selectedSizes[product.id] === size ? 'bg-stone-900 border-stone-900 text-white shadow-lg' : 'bg-white border-stone-100 text-stone-400 hover:border-orange-200'}`}
                          >
                            {size}
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  )}

                  <motion.button 
                    whileHover={{ y: -5 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => addToCart(product)} 
                    className={`mt-auto w-full py-5 rounded-[1.5rem] font-black text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-3 ${
                      (!selectedSizes[product.id] && product.category !== 'Caps' && product.category !== 'Accessories')
                      ? 'bg-stone-100 text-stone-300 cursor-not-allowed'
                      : 'bg-stone-950 text-white hover:bg-orange-600 shadow-xl'
                    }`}
                  >
                    <ShoppingBag className="w-4 h-4" />
                    Add to Basket
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      </main>

      {/* Brand Promise Block */}
      <div className="max-w-7xl mx-auto px-4 mb-24">
        <section className="grid grid-cols-1 md:grid-cols-3 gap-8 p-12 bg-blue-950 rounded-[3.5rem] relative overflow-hidden shadow-2xl">
          <KampalaPattern />
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="relative z-10 text-center md:text-left">
            <div className="w-16 h-16 bg-orange-600 rounded-2xl flex items-center justify-center text-white mx-auto md:mx-0 mb-6 shadow-xl shadow-orange-950/20">
              <Truck size={32} />
            </div>
            <h5 className="text-2xl font-black text-white mb-2 uppercase tracking-tighter">Sharp Delivery</h5>
            <p className="text-blue-100/60 font-bold text-sm leading-relaxed">Lagos, Abuja, London, or Atlanta—we go reach you sharp-sharp. No stories.</p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }} className="relative z-10 text-center md:text-left">
            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white mx-auto md:mx-0 mb-6 shadow-xl shadow-blue-950/20">
              <ShieldCheck size={32} />
            </div>
            <h5 className="text-2xl font-black text-white mb-2 uppercase tracking-tighter">Authentic Only</h5>
            <p className="text-blue-100/60 font-bold text-sm leading-relaxed">Original materials. This no be generic gbedu. Quality stand gidigba for your body.</p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }} className="relative z-10 text-center md:text-left">
            <div className="w-16 h-16 bg-green-600 rounded-2xl flex items-center justify-center text-white mx-auto md:mx-0 mb-6 shadow-xl shadow-green-950/20">
              <Star size={32} />
            </div>
            <h5 className="text-2xl font-black text-white mb-2 uppercase tracking-tighter">For The Culture</h5>
            <p className="text-blue-100/60 font-bold text-sm leading-relaxed">Every kobo goes back into building the Pidgin community. Represent the Identity.</p>
          </motion.div>
        </section>
      </div>

      {/* FOOTER */}
      <footer className="bg-stone-950 text-white pt-24 pb-12 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-12 gap-16 mb-20 relative z-10">
          <div className="md:col-span-5">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-white text-stone-950 flex items-center justify-center font-black rounded-xl text-xl shadow-lg">TPB</div>
              <h6 className="font-black text-3xl uppercase tracking-tighter">Merch House</h6>
            </div>
            <p className="text-stone-400 text-lg font-medium leading-relaxed max-w-md mb-8">
              The only place where Pidgin excellence meets premium streetwear. 
              We no just dey sell clothes, we dey sell Identity.
            </p>
            <div className="flex gap-4">
              {[Instagram, Twitter, Facebook, Youtube].map((Icon, i) => (
                <motion.a 
                  key={i} href="#" 
                  whileHover={{ y: -5, color: '#ea580c' }}
                  className="w-12 h-12 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center transition-colors"
                >
                  <Icon size={20} />
                </motion.a>
              ))}
            </div>
          </div>
          <div className="md:col-span-2">
            <h6 className="text-[10px] font-black uppercase tracking-[0.3em] text-orange-500 mb-8">Shop Selection</h6>
            <ul className="space-y-4 font-black text-lg uppercase tracking-tight">
              {['New Drops', 'Best Sellers', 'Accessories', 'Lookbook'].map(link => (
                <li key={link}><a href="#" className="text-stone-300 hover:text-white transition-colors flex items-center gap-2 group">{link} <ArrowUpRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-all" /></a></li>
              ))}
            </ul>
          </div>
          <div className="md:col-span-2">
            <h6 className="text-[10px] font-black uppercase tracking-[0.3em] text-orange-500 mb-8">Support</h6>
            <ul className="space-y-4 font-black text-lg uppercase tracking-tight">
              {['Track Order', 'Size Guide', 'Shipping', 'Contact'].map(link => (
                <li key={link}><a href="#" className="text-stone-300 hover:text-white transition-colors">{link}</a></li>
              ))}
            </ul>
          </div>
          <div className="md:col-span-3">
            <h6 className="text-[10px] font-black uppercase tracking-[0.3em] text-orange-500 mb-8">Stay Sharp</h6>
            <p className="text-stone-400 font-bold text-sm mb-6">Drop your email make we dey alert you when fresh gbedu land.</p>
            <div className="relative">
              <input type="email" placeholder="you@email.com" className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-5 text-sm font-bold focus:ring-2 ring-orange-500 outline-none" />
              <button className="absolute right-2 top-2 bg-white text-stone-950 p-2 rounded-xl hover:bg-orange-600 hover:text-white transition-all"><ChevronRight size={20} /></button>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8 relative z-10">
          <p className="text-stone-500 font-black uppercase text-[10px] tracking-[0.3em]">© 2026 THE PIDGIN BLOG MERCH HOUSE. REPRESENT THE CULTURE.</p>
        </div>
        <AnkaraBorder className="absolute bottom-0 left-0" />
      </footer>

      {/* Chatbot UI */}
      <div className="fixed bottom-10 right-10 z-[70]">
        <AnimatePresence>
          {isChatOpen && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 50, transformOrigin: 'bottom right' }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 50 }}
              className="w-[90vw] max-w-[400px] h-[600px] bg-white rounded-[2.5rem] shadow-4xl border border-stone-100 flex flex-col overflow-hidden mb-6"
            >
              <div className="p-8 bg-blue-950 text-white flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-orange-600 rounded-2xl flex items-center justify-center font-black shadow-lg">TPB</div>
                  <div>
                    <h4 className="font-black text-sm uppercase">Merch Guy</h4>
                    <span className="text-[10px] font-black opacity-60 tracking-widest uppercase flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span> Dey Online
                    </span>
                  </div>
                </div>
                <button onClick={() => setIsChatOpen(false)} className="p-2 hover:bg-white/10 rounded-full"><X /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-8 space-y-6 no-scrollbar bg-stone-50/50">
                {chatMessages.map((msg, i) => (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] p-5 rounded-3xl font-bold text-sm leading-relaxed ${msg.role === 'user' ? 'bg-stone-900 text-white rounded-br-none' : 'bg-white text-stone-800 shadow-sm border border-stone-100 rounded-bl-none'}`}>
                      {msg.text}
                    </div>
                  </motion.div>
                ))}
                {isTyping && <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1.5 }} className="text-stone-400 text-[10px] font-black uppercase tracking-widest pl-2">Guy dey type...</motion.div>}
                <div ref={chatEndRef} />
              </div>
              <div className="p-6 bg-white border-t border-stone-100 flex gap-3">
                <input 
                  type="text" value={userInput} onChange={(e) => setUserInput(e.target.value)} 
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()} 
                  placeholder="Ask me anything in Pidgin..." 
                  className="flex-1 bg-stone-50 border-none rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 ring-orange-500 outline-none" 
                />
                <motion.button whileTap={{ scale: 0.9 }} onClick={sendMessage} className="bg-orange-600 text-white p-4 rounded-2xl shadow-lg"><Send className="w-5 h-5" /></motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        <div className="relative group flex items-center justify-end">
          {/* Label: "Ask Me" */}
          {!isChatOpen && (
             <motion.div 
               initial={{ opacity: 0, x: 20 }}
               animate={{ opacity: 1, x: 0 }}
               className="absolute right-20 top-1/2 -translate-y-1/2 bg-stone-900 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl border border-stone-800 whitespace-nowrap pointer-events-none mr-2"
             >
               Ask Me
               <div className="absolute right-[-4px] top-1/2 -translate-y-1/2 w-2 h-2 bg-stone-900 rotate-45" />
             </motion.div>
          )}

          <motion.button 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            animate={!isChatOpen ? {
              x: [0, -2, 2, -2, 2, 0],
              transition: { repeat: Infinity, repeatDelay: 3, duration: 0.5 }
            } : {}}
            onClick={() => setIsChatOpen(!isChatOpen)}
            className="w-16 h-16 bg-orange-600 text-white rounded-[1.5rem] shadow-3xl flex items-center justify-center relative active:bg-orange-700 transition-colors"
          >
            {isChatOpen ? <X size={28} /> : <MessageSquare size={28} />}
          </motion.button>
        </div>
      </div>

      {/* Cart Drawer */}
      <AnimatePresence>
        {isCartOpen && (
          <div className="fixed inset-0 z-[100]">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-stone-950/40 backdrop-blur-md" onClick={() => setIsCartOpen(false)} />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 30, stiffness: 200 }} className="absolute right-0 top-0 h-full w-full max-w-xl bg-white shadow-5xl flex flex-col">
              <AnkaraBorder className="absolute top-0 left-0" />
              <div className="p-10 pt-16 flex items-center justify-between border-b border-stone-50">
                <div><h2 className="text-4xl font-black uppercase tracking-tighter">{checkoutStep === 'cart' ? 'Your Basket' : 'Details'}</h2><p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mt-1">Confirm drip before payment</p></div>
                <button onClick={() => setIsCartOpen(false)} className="p-4 hover:bg-stone-50 rounded-full transition-colors"><X className="w-8 h-8" /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-10 no-scrollbar">
                {checkoutStep === 'cart' ? (cart.length === 0 ? <div className="h-full flex flex-col items-center justify-center text-center opacity-30"><ShoppingBag className="w-24 h-24 mb-6" /><h3 className="text-2xl font-black uppercase tracking-widest">No Gbedu inside</h3></div> : <div className="space-y-10">
                    {cart.map((item, i) => (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }} key={`${item.id}-${item.size}`} className="flex gap-8 group font-black">
                      <div className="w-32 h-40 bg-stone-100 rounded-[2rem] overflow-hidden shrink-0 shadow-sm"><img src={item.image} alt={item.name} className="w-full h-full object-cover" /></div>
                      <div className="flex-1 flex flex-col justify-between py-2">
                        <div className="flex justify-between items-start uppercase"><h4>{item.name}</h4><button onClick={() => updateQty(item.id, item.size, -item.qty)}><Trash2 className="w-5 h-5 text-stone-300 hover:text-red-500 transition-colors" /></button></div>
                        <span className="inline-block px-3 py-1 bg-stone-100 rounded-lg text-[10px] font-black uppercase mt-2 tracking-widest text-stone-500">Size: {item.size}</span>
                        <div className="flex items-center justify-between mt-4">
                          <div className="flex items-center gap-5 bg-stone-50 rounded-2xl px-5 py-3 shadow-inner"><button onClick={() => updateQty(item.id, item.size, -1)}><Minus size={14}/></button><span>{item.qty}</span><button onClick={() => updateQty(item.id, item.size, 1)}><Plus size={14}/></button></div>
                          <span className="text-xl">₦{(item.price * item.qty).toLocaleString()}</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}</div>) : (<div className="space-y-8">{['fullName', 'email', 'phone'].map(field => (
                      <div key={field} className="space-y-3 font-black"><label className="text-[10px] uppercase text-stone-400 tracking-widest">{field === 'fullName' ? 'Full Name' : field}</label><input type={field === 'email' ? 'email' : 'text'} name={field} value={formData[field]} onChange={handleInputChange} placeholder={`Enter your ${field}`} className="w-full p-6 bg-stone-50 border-none rounded-[1.5rem] font-bold text-lg focus:ring-2 ring-orange-500 outline-none" /></div>
                    ))}<div className="space-y-3 font-black"><label className="text-[10px] uppercase text-stone-400 tracking-widest">Delivery Address</label><textarea name="address" value={formData.address} onChange={handleInputChange} placeholder="No stories, enter house address" rows="4" className="w-full p-6 bg-stone-50 border-none rounded-[1.5rem] font-bold text-lg focus:ring-2 ring-orange-500 resize-none outline-none" /></div></div>)}
              </div>
              {cart.length > 0 && (<div className="p-10 bg-stone-50 border-t border-stone-100 space-y-8"><div className="flex justify-between items-center font-black"><span className="text-stone-400 text-sm uppercase tracking-widest">Grand Total</span><span className="text-4xl">₦{cartTotal.toLocaleString()}</span></div>{checkoutStep === 'cart' ? <motion.button whileTap={{ scale: 0.95 }} onClick={() => setCheckoutStep('details')} className="w-full bg-stone-950 text-white py-8 rounded-[2rem] font-black text-xl uppercase tracking-widest shadow-2xl">Confirm Details</motion.button> : <motion.button whileTap={{ scale: 0.95 }} onClick={payWithPaystack} disabled={!isFormValid} className="w-full bg-orange-600 disabled:bg-stone-200 text-white py-8 rounded-[2rem] font-black text-xl uppercase tracking-widest shadow-3xl shadow-orange-600/20">Pay Now (No Dulling)</motion.button>}</div>)}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>{orderPlaced && (<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-blue-950/90 backdrop-blur-xl"><motion.div initial={{ scale: 0.8, y: 50 }} animate={{ scale: 1, y: 0 }} className="bg-white rounded-[4rem] p-16 max-w-lg w-full text-center shadow-5xl border-8 border-orange-500/10"><div className="w-32 h-32 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-10 shadow-inner"><ShieldCheck size={64} /></div><h4 className="text-5xl font-black mb-6 uppercase tracking-tighter">E DON HAPPEN! 🎉</h4><p className="text-stone-500 font-bold mb-12 leading-relaxed uppercase text-sm tracking-wide">Order don land! Payment confirmed sharp-sharp. Look out for our call.</p><div className="w-full h-3 bg-stone-100 rounded-full overflow-hidden"><motion.div initial={{ x: '-100%' }} animate={{ x: '0%' }} transition={{ duration: 5 }} className="h-full bg-orange-600"></motion.div></div></motion.div></motion.div>)}</AnimatePresence>
      <style>{`.no-scrollbar::-webkit-scrollbar { display: none; }.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }::selection { background: #ea580c; color: white; }`}</style>
    </div>
  );
};

export default App;