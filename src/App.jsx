import React, { useState, useMemo, useEffect } from 'react';
import { 
  ShoppingBag, 
  Search, 
  X, 
  Plus, 
  Minus, 
  Trash2, 
  ChevronRight, 
  ShieldCheck,
  Truck,
  CreditCard,
  MapPin,
  User,
  Phone,
  Mail,
  ArrowLeft,
  Tag,
  Star
} from 'lucide-react';

// --- PAYSTACK SCRIPT LOADER ---
const usePaystack = () => {
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://js.paystack.co/v1/inline.js';
    script.async = true;
    script.onload = () => setLoaded(true);
    document.body.appendChild(script);
    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);
  return loaded;
};

// --- VISUAL THEME COMPONENTS ---

// Kampala "Adire" Tie-Dye Pattern Background
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

// Ankara Geometric Border Pattern
const AnkaraBorder = ({ className = "" }) => (
  <div className={`h-4 w-full ${className}`} style={{
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
  const [checkoutStep, setCheckoutStep] = useState('cart'); // 'cart' or 'details'
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [orderPlaced, setOrderPlaced] = useState(false);

  // Form State for detailed delivery
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: ''
  });

  const categories = ["All", "Shorts", "Shirts", "Hoodies", "Caps"];

  const products = [
    { id: 1, name: "TPB 'Signature' Hoodie", price: 32000, category: "Hoodies", image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&q=80&w=600", description: "Heavyweight cotton with TPB logo embroidery. Kampala dye accents inside the hood." },
    { id: 2, name: "TPB 'Lamba' Shorts", price: 18000, category: "Shorts", image: "https://images.unsplash.com/photo-1591195853828-11db59a44f6b?auto=format&fit=crop&q=80&w=600", description: "Breathable shorts for the Lagos heat. TPB rubber patch on the left leg." },
    { id: 3, name: "TPB 'Wetin Dey' Tee", price: 14500, category: "Shirts", image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&q=80&w=600", description: "High-density screen print on premium black cotton. No go fade." },
    { id: 4, name: "TPB Mesh Trucker Cap", price: 9000, category: "Caps", image: "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&q=80&w=600", description: "Structured 5-panel cap with 'The Pidgin Blog' script embroidery." },
    { id: 5, name: "TPB Street Joggers", price: 25000, category: "Shorts", image: "https://images.unsplash.com/photo-1552902865-b72c031ac5ea?auto=format&fit=crop&q=80&w=600", description: "Slim-fit joggers with Ankara pocket detailing. Strictly for kings." },
    { id: 6, name: "TPB Branding Tote", price: 6500, category: "Accessories", image: "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&q=80&w=600", description: "Heavy canvas material for your daily market run." }
  ];

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesCategory = activeCategory === 'All' || p.category === activeCategory;
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, searchQuery]);

  const addToCart = (product) => {
    setCart(prev => {
      const exists = prev.find(item => item.id === product.id);
      if (exists) {
        return prev.map(item => item.id === product.id ? { ...item, qty: item.qty + 1 } : item);
      }
      return [...prev, { ...product, qty: 1 }];
    });
    setCheckoutStep('cart');
    setIsCartOpen(true);
  };

  const updateQty = (id, delta) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(0, item.qty + delta);
        return newQty === 0 ? null : { ...item, qty: newQty };
      }
      return item;
    }).filter(Boolean));
  };

  const cartTotal = cart.reduce((acc, item) => acc + (item.price * item.qty), 0);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const payWithPaystack = () => {
    if (!paystackLoaded) return;

    const handler = window.PaystackPop.setup({
      key: 'pk_live_80cab3e2f524cc53e4c88c49fe1f0fccebcb9b23',
      email: formData.email,
      amount: cartTotal * 100, // Kobo conversion
      currency: "NGN",
      ref: 'TPB_' + Math.floor((Math.random() * 1000000000) + 1),
      metadata: {
        custom_fields: [
          { display_name: "Full Name", variable_name: "full_name", value: formData.fullName },
          { display_name: "Phone Number", variable_name: "phone_number", value: formData.phone },
          { display_name: "Delivery Address", variable_name: "delivery_address", value: formData.address }
        ]
      },
      callback: (response) => {
        setOrderPlaced(true);
        setCart([]);
        setTimeout(() => {
          setOrderPlaced(false);
          setIsCartOpen(false);
          setCheckoutStep('cart');
        }, 5000);
      },
      onClose: () => { console.log("User closed payment window"); }
    });
    handler.openIframe();
  };

  const isFormValid = formData.fullName && formData.email && formData.phone && formData.address;

  return (
    <div className="min-h-screen bg-[#fafaf9] text-stone-900 font-sans pb-10">
      <AnkaraBorder className="fixed top-0 z-[60]" />
      
      {/* Navigation */}
      <nav className="sticky top-4 z-50 mx-4 bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border border-stone-200 mt-4">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-900 text-white flex items-center justify-center font-black rounded-xl rotate-3 shadow-lg overflow-hidden relative group">
              <div className="absolute inset-0 opacity-40 bg-[url('https://www.transparenttextures.com/patterns/batik-fabric.png')]"></div>
              <span className="relative z-10 text-xl">TPB</span>
            </div>
            <div>
              <h1 className="font-black text-xl tracking-tighter leading-none uppercase">Merch House</h1>
              <span className="text-[10px] font-bold text-orange-600 tracking-widest uppercase">The Pidgin Blog</span>
            </div>
          </div>

          <div className="hidden md:flex flex-1 max-w-lg mx-12">
            <div className="relative w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 w-5 h-5" />
              <input 
                type="text" 
                placeholder="Find your size, find your vibe..." 
                className="w-full pl-12 pr-4 py-3 bg-stone-100 rounded-full border-none focus:ring-2 ring-blue-900/10 transition-all font-medium"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <button 
            onClick={() => setIsCartOpen(true)}
            className="flex items-center gap-2 bg-stone-950 text-white px-5 py-3 rounded-xl font-bold hover:bg-orange-600 transition-all group active:scale-95"
          >
            <ShoppingBag className="w-5 h-5" />
            <span className="hidden sm:inline">Basket</span>
            {cart.length > 0 && (
              <span className="bg-white text-stone-900 text-xs w-6 h-6 rounded-full flex items-center justify-center font-black">
                {cart.reduce((a, b) => a + b.qty, 0)}
              </span>
            )}
          </button>
        </div>
      </nav>

      {/* Hero Section: Kampala Tie-Dye Theme */}
      <header className="relative py-20 px-4 mt-4">
        <div className="max-w-7xl mx-auto rounded-[3rem] overflow-hidden relative shadow-2xl bg-blue-950 min-h-[450px] flex items-center">
          <KampalaPattern />
          <div className="relative z-10 p-8 md:p-20 text-white max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-orange-500/20 text-orange-400 px-4 py-1.5 rounded-full border border-orange-500/30 text-xs font-black mb-6 tracking-widest uppercase">
              <Tag className="w-4 h-4" />
              Correct Drops Don Land
            </div>
            <h2 className="text-5xl md:text-8xl font-black leading-[0.9] mb-6 uppercase">
              REPRESENT <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-yellow-200">The Culture</span>
            </h2>
            <p className="text-lg md:text-2xl text-blue-100/80 mb-10 max-w-xl leading-relaxed font-medium">
              This no be generic gbedu. 100% TPB Identity. Kampala vibes, Ankara textures, and pure Pidgin excellence.
            </p>
            <div className="flex flex-wrap gap-4">
              <button className="bg-white text-blue-950 px-8 py-4 rounded-2xl font-black text-lg hover:bg-orange-500 hover:text-white transition-all shadow-xl">
                Shop The Drop
              </button>
            </div>
          </div>
          {/* Decorative Ankara Circle Element */}
          <div className="absolute right-[-80px] top-[-80px] w-96 h-96 rounded-full border-[60px] border-orange-600/10 hidden lg:block" />
        </div>
      </header>

      {/* Main Shop Section */}
      <main className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12">
          <div>
            <h3 className="text-4xl font-black text-stone-900 mb-2 uppercase tracking-tighter">Pick Your Vibe</h3>
            <p className="text-stone-400 font-bold uppercase tracking-widest text-xs">Only the best for the blog fam</p>
          </div>
          
          <div className="flex items-center gap-2 overflow-x-auto pb-4 no-scrollbar">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-8 py-3 rounded-2xl font-black transition-all whitespace-nowrap ${
                  activeCategory === cat 
                  ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/30 -translate-y-1' 
                  : 'bg-white text-stone-500 border border-stone-200 hover:border-orange-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
          {filteredProducts.map(product => (
            <div key={product.id} className="group relative">
              <div className="bg-white rounded-[2.5rem] overflow-hidden border border-stone-200 hover:border-orange-500 transition-all duration-500 hover:shadow-2xl">
                <div className="aspect-[4/5] bg-stone-100 overflow-hidden relative">
                  <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                  <div className="absolute top-6 left-6">
                    <span className="bg-white/95 backdrop-blur px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest text-blue-900 shadow-sm border border-stone-100">
                      {product.category}
                    </span>
                  </div>
                </div>

                <div className="p-8">
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="text-xl font-black text-stone-900 leading-tight group-hover:text-orange-600 transition-colors uppercase">
                      {product.name}
                    </h4>
                    <span className="text-lg font-black text-stone-950">₦{product.price.toLocaleString()}</span>
                  </div>
                  <p className="text-stone-500 text-sm mb-8 line-clamp-2 font-medium">
                    {product.description}
                  </p>
                  
                  <button 
                    onClick={() => addToCart(product)}
                    className="w-full flex items-center justify-center gap-3 bg-stone-950 text-white py-4 rounded-2xl font-black group-hover:bg-orange-600 transition-all shadow-lg"
                  >
                    <Plus className="w-5 h-5" />
                    ADD TO BASKET
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Brand Promise Section */}
        <section className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8 p-12 bg-blue-950 rounded-[3rem] relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/african-cane.png')]"></div>
          
          <div className="relative z-10 text-center md:text-left">
            <div className="w-14 h-14 bg-orange-600 rounded-2xl flex items-center justify-center text-white mx-auto md:mx-0 mb-6 shadow-xl">
              <Truck className="w-7 h-7" />
            </div>
            <h5 className="text-xl font-black text-white mb-2">SHARP DELIVERY</h5>
            <p className="text-blue-100/60 font-medium text-sm">Lagos, Abuja, PH or Abroad. We go reach you sharp-sharp.</p>
          </div>

          <div className="relative z-10 text-center md:text-left">
            <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white mx-auto md:mx-0 mb-6 shadow-xl">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <h5 className="text-xl font-black text-white mb-2">AUTHENTIC ONLY</h5>
            <p className="text-blue-100/60 font-medium text-sm">Heavy cotton, Ankara trim, real Kampala dye. Quality stand gidigba.</p>
          </div>

          <div className="relative z-10 text-center md:text-left">
            <div className="w-14 h-14 bg-green-600 rounded-2xl flex items-center justify-center text-white mx-auto md:mx-0 mb-6 shadow-xl">
              <Star className="w-7 h-7" />
            </div>
            <h5 className="text-xl font-black text-white mb-2">FOR THE CULTURE</h5>
            <p className="text-blue-100/60 font-medium text-sm">TPB Merch House be home for everyone representing Pidgin Excellence.</p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white pt-20 pb-10 border-t border-stone-200 relative">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="col-span-1 md:col-span-2">
             <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-blue-900 rounded-lg flex items-center justify-center text-white font-black text-xs uppercase">TPB</div>
                <h6 className="font-black text-2xl tracking-tighter uppercase">Merch House</h6>
             </div>
             <p className="text-stone-500 text-lg max-w-sm font-medium">
               The official shopping destination for The Pidgin Blog. Dress the vibe, support the culture.
             </p>
          </div>
          <div>
            <h6 className="font-black mb-6 uppercase tracking-widest text-[10px] text-stone-400">Shop</h6>
            <ul className="space-y-4 font-black text-stone-700">
              <li><a href="#" className="hover:text-orange-600 transition-colors">New Arrivals</a></li>
              <li><a href="#" className="hover:text-orange-600 transition-colors">The Lookbook</a></li>
              <li><a href="#" className="hover:text-orange-600 transition-colors">Campaigns</a></li>
            </ul>
          </div>
          <div>
            <h6 className="font-black mb-6 uppercase tracking-widest text-[10px] text-stone-400">Connect</h6>
            <ul className="space-y-4 font-black text-stone-700">
              <li><a href="#" className="hover:text-orange-600 transition-colors">Instagram</a></li>
              <li><a href="#" className="hover:text-orange-600 transition-colors">Twitter (X)</a></li>
              <li><a href="#" className="hover:text-orange-600 transition-colors">The Blog</a></li>
            </ul>
          </div>
        </div>
        <AnkaraBorder className="absolute bottom-0 left-0" />
      </footer>

      {/* Checkout Sidebar Overlay */}
      <div className={`fixed inset-0 z-[100] transition-opacity duration-500 ${isCartOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm" onClick={() => setIsCartOpen(false)} />
        <div className={`absolute right-0 top-0 h-full w-full max-w-lg bg-white shadow-2xl transition-transform duration-500 transform ${isCartOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="flex flex-col h-full relative">
            <AnkaraBorder className="absolute top-0 left-0" />
            
            <div className="p-8 pt-12 flex items-center justify-between border-b border-stone-100">
              <div>
                <h2 className="text-3xl font-black text-stone-950 uppercase tracking-tighter">
                  {checkoutStep === 'cart' ? 'Your Basket' : 'Delivery Details'}
                </h2>
                <p className="text-stone-400 text-[10px] font-black uppercase tracking-widest mt-1">
                  {checkoutStep === 'cart' ? 'Quality Gbedu Only' : 'Abeg Fill Am Correct'}
                </p>
              </div>
              <button onClick={() => setIsCartOpen(false)} className="p-3 hover:bg-stone-100 rounded-full transition-colors"><X className="w-6 h-6" /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 no-scrollbar">
              {checkoutStep === 'cart' ? (
                // --- BASKET VIEW ---
                cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center">
                    <ShoppingBag className="w-16 h-16 text-stone-200 mb-6" />
                    <h3 className="text-2xl font-black mb-2">Basket dey empty!</h3>
                    <p className="text-stone-400 font-medium mb-8">You never pick any drip yet. Go find wetin you like.</p>
                    <button onClick={() => setIsCartOpen(false)} className="bg-stone-950 text-white px-10 py-4 rounded-2xl font-black uppercase shadow-lg">Start Shopping</button>
                  </div>
                ) : (
                  <div className="space-y-8">
                    {cart.map(item => (
                      <div key={item.id} className="flex gap-6 animate-in slide-in-from-right duration-300">
                        <div className="w-24 h-32 bg-stone-100 rounded-2xl overflow-hidden shrink-0 border border-stone-100 shadow-sm">
                          <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 flex flex-col justify-between py-1">
                          <div>
                            <div className="flex justify-between items-start gap-4">
                              <h4 className="font-black text-stone-900 leading-tight uppercase text-lg">{item.name}</h4>
                              <button onClick={() => updateQty(item.id, -item.qty)} className="text-stone-300 hover:text-red-600 transition-colors"><Trash2 className="w-5 h-5" /></button>
                            </div>
                            <p className="text-orange-600 font-black text-sm mt-1">₦{item.price.toLocaleString()}</p>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4 bg-stone-100 rounded-xl px-4 py-2">
                              <button onClick={() => updateQty(item.id, -1)} className="hover:text-orange-600 transition-colors"><Minus className="w-4 h-4" /></button>
                              <span className="font-black w-6 text-center">{item.qty}</span>
                              <button onClick={() => updateQty(item.id, 1)} className="hover:text-orange-600 transition-colors"><Plus className="w-4 h-4" /></button>
                            </div>
                            <span className="font-black text-stone-950">₦{(item.price * item.qty).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              ) : (
                // --- DELIVERY FORM ---
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-stone-400 tracking-widest flex items-center gap-2">
                      <User className="w-3 h-3" /> Full Name
                    </label>
                    <input 
                      type="text" name="fullName" value={formData.fullName} onChange={handleInputChange}
                      placeholder="Enter your name"
                      className="w-full p-4 bg-stone-100 border-none rounded-2xl focus:ring-2 ring-orange-500 font-bold"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-stone-400 tracking-widest flex items-center gap-2">
                      <Mail className="w-3 h-3" /> Email Address
                    </label>
                    <input 
                      type="email" name="email" value={formData.email} onChange={handleInputChange}
                      placeholder="you@email.com"
                      className="w-full p-4 bg-stone-100 border-none rounded-2xl focus:ring-2 ring-orange-500 font-bold"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-stone-400 tracking-widest flex items-center gap-2">
                      <Phone className="w-3 h-3" /> Phone Number
                    </label>
                    <input 
                      type="tel" name="phone" value={formData.phone} onChange={handleInputChange}
                      placeholder="080 123 4567"
                      className="w-full p-4 bg-stone-100 border-none rounded-2xl focus:ring-2 ring-orange-500 font-bold"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-stone-400 tracking-widest flex items-center gap-2">
                      <MapPin className="w-3 h-3" /> Delivery Address
                    </label>
                    <textarea 
                      name="address" value={formData.address} onChange={handleInputChange}
                      placeholder="Full delivery location details"
                      rows="4"
                      className="w-full p-4 bg-stone-100 border-none rounded-2xl focus:ring-2 ring-orange-500 font-bold resize-none"
                    />
                  </div>
                  <button onClick={() => setCheckoutStep('cart')} className="flex items-center gap-2 text-stone-400 font-black text-[10px] uppercase hover:text-orange-600 transition-colors">
                    <ArrowLeft className="w-4 h-4" /> Change Items In Basket
                  </button>
                </div>
              )}
            </div>

            {cart.length > 0 && (
              <div className="p-8 bg-stone-50 border-t border-stone-200 space-y-6">
                <div className="flex justify-between items-center">
                  <span className="text-stone-400 font-black uppercase tracking-widest text-[10px]">Total Cost</span>
                  <span className="text-3xl font-black text-stone-950">₦{cartTotal.toLocaleString()}</span>
                </div>
                
                {checkoutStep === 'cart' ? (
                  <button 
                    onClick={() => setCheckoutStep('details')}
                    className="w-full bg-stone-950 text-white py-6 rounded-[2rem] font-black text-lg hover:bg-stone-800 transition-all flex items-center justify-center gap-3 shadow-xl"
                  >
                    ENTER DELIVERY INFO
                    <ChevronRight className="w-6 h-6" />
                  </button>
                ) : (
                  <button 
                    onClick={payWithPaystack}
                    disabled={!isFormValid || !paystackLoaded}
                    className="w-full bg-orange-600 disabled:bg-stone-300 text-white py-6 rounded-[2rem] font-black text-xl shadow-2xl transition-all flex items-center justify-center gap-3 active:scale-95"
                  >
                    <CreditCard className="w-6 h-6" />
                    PAY NOW (SHARP-SHARP)
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Success Notification Modal */}
      {orderPlaced && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
           <div className="absolute inset-0 bg-stone-900/80 backdrop-blur-md" />
           <div className="relative bg-white rounded-[3rem] p-12 max-w-md w-full text-center shadow-2xl animate-in zoom-in duration-300">
              <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-8 animate-bounce">
                <ShieldCheck className="w-12 h-12" />
              </div>
              <h4 className="text-4xl font-black mb-4 uppercase leading-none tracking-tighter">E DON HAPPEN! 🎉</h4>
              <p className="text-stone-500 font-bold mb-10 leading-relaxed uppercase text-sm">
                Payment confirmed! Your TPB drip don land inside system. We go contact you sharp-sharp once we dey come your way.
              </p>
              <div className="w-full h-2 bg-stone-100 rounded-full overflow-hidden">
                <div className="h-full bg-orange-600" style={{ width: '100%', animation: 'progress 5s linear' }}></div>
              </div>
           </div>
        </div>
      )}

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes progress { from { width: 0%; } to { width: 100%; } }
      `}</style>
    </div>
  );
};

export default App;