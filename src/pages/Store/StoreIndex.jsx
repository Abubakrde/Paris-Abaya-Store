import React, { useState, useEffect, useMemo } from 'react';
import { ShoppingBag, Search, Menu, X, Instagram, Facebook, ArrowRight, Star, Heart, CheckCircle2, ShieldCheck, Truck, RotateCcw, Phone, MessageCircle } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

const Storefront = () => {
    // Data State
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);

    // UI State
    const [cart, setCart] = useState([]);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null); // For Quick View
    const [orderStep, setOrderStep] = useState('form');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    // Checkout Info
    const [customerInfo, setCustomerInfo] = useState({ name: '', phone: '', address: '', paymentMethod: 'ZAAD-USD' });
    const [processing, setProcessing] = useState(false);
    const [lastOrder, setLastOrder] = useState(null);

    // Temporary Size Selection for Quick View
    const [selectedSize, setSelectedSize] = useState('');

    useEffect(() => {
        fetchStoreData();
        const savedCart = localStorage.getItem('paris_abaya_cart');
        if (savedCart) setCart(JSON.parse(savedCart));

        const handleScroll = () => setScrolled(window.scrollY > 50);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Effect to pre-select size when opening quick view
    useEffect(() => {
        if (selectedProduct && selectedProduct.sizes?.length > 0) {
            setSelectedSize(selectedProduct.sizes[0]);
        }
    }, [selectedProduct]);

    useEffect(() => {
        localStorage.setItem('paris_abaya_cart', JSON.stringify(cart));
    }, [cart]);

    const fetchStoreData = async () => {
        try {
            setLoading(true);
            const { data: prodData } = await supabase.from('products').select('*').gt('stock', 0).order('created_at', { ascending: false });
            const { data: catData } = await supabase.from('categories').select('name');
            setProducts(prodData || []);
            setCategories(['All', ...(catData?.map(c => c.name) || [])]);
        } catch (error) {
            console.error('Error loading store:', error);
        } finally {
            setLoading(false);
        }
    };

    const addToCart = (product, size) => {
        // 1. If size is explicitly provided, use it.
        // 2. If no size provided (grid click), but product has only 1 size, use that (auto-add).
        // 3. Otherwise (multiple sizes), open modal for selection.

        let targetSize = size;

        if (!targetSize) {
            if (product.sizes?.length === 1) {
                targetSize = product.sizes[0];
            } else if (product.sizes?.length > 1) {
                setSelectedProduct(product);
                return;
            } else {
                targetSize = 'Standard';
            }
        }

        setCart(prev => {
            const cartKey = `${product.id}-${targetSize}`;
            const exists = prev.find(item => item.cartKey === cartKey);
            if (exists) {
                return prev.map(item => item.cartKey === cartKey ? { ...item, qty: item.qty + 1 } : item);
            }
            return [...prev, { ...product, cartKey, selectedSize: targetSize, qty: 1 }];
        });
        setIsCartOpen(true);
        // Only close modal if we were in the modal (selectedProduct was set)
        if (selectedProduct) {
            setSelectedProduct(null);
            setSelectedSize('');
        }
    };

    const removeFromCart = (cartKey) => {
        setCart(prev => prev.filter(item => item.cartKey !== cartKey));
    };

    const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);

    const filteredProducts = useMemo(() => {
        return products.filter(p => {
            const matchesCat = selectedCategory === 'All' || p.category === selectedCategory;
            const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));
            return matchesCat && matchesSearch;
        });
    }, [products, selectedCategory, searchQuery]);

    const handleCheckout = async (e) => {
        e.preventDefault();
        setProcessing(true);
        try {
            for (const item of cart) {
                const { data, error } = await supabase.rpc('process_sale', {
                    p_product_id: item.id,
                    p_quantity: item.qty,
                    p_seller_id: null,
                    p_customer_name: customerInfo.name,
                    p_payment_method: customerInfo.paymentMethod,
                    p_customer_id: null,
                    p_status: 'Unpaid',
                    p_is_approved: false,
                    p_delivery_info: {
                        phone: customerInfo.phone,
                        address: customerInfo.address,
                        size: item.selectedSize
                    }
                });
                if (error) throw error;
            }
            setLastOrder({ items: [...cart], total: cartTotal, method: customerInfo.paymentMethod });
            setOrderStep('success');
            setCart([]);
        } catch (error) {
            alert('Order failed: ' + error.message);
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#fafafa] font-['Outfit'] text-gray-900 selection:bg-red-900 selection:text-white">

            {/* --- Navigation --- */}
            <nav className={`fixed top-0 w-full z-50 transition-all duration-500 ${scrolled ? 'bg-white/90 backdrop-blur-xl border-b border-gray-100 py-4 shadow-sm' : 'bg-transparent py-6'}`}>
                <div className="max-w-[1600px] mx-auto px-6 md:px-12 flex justify-between items-center">
                    <div className="flex items-center gap-16">
                        <h1 onClick={() => { setSelectedCategory('All'); setSearchQuery(''); window.scrollTo(0, 0); }}
                            className={`text-2xl md:text-3xl font-black tracking-tighter cursor-pointer transition-colors font-playfair ${scrolled ? 'text-red-900' : 'text-white'}`}>
                            PARIS ABAYA
                        </h1>
                        <div className={`hidden lg:flex gap-8 text-[11px] font-bold uppercase tracking-[0.2em] transition-colors ${scrolled ? 'text-gray-500' : 'text-white/80'}`}>
                            {['Catalog', 'Atelier', 'Contact'].map(item => (
                                <a key={item} href={`#${item.toLowerCase()}`} className="hover:text-red-600 transition-all hover:scale-105">{item}</a>
                            ))}
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className={`hidden md:flex items-center rounded-full px-5 py-2.5 transition-all ${isSearching ? 'bg-white ring-2 ring-red-100 w-72' : scrolled ? 'bg-gray-100 w-56' : 'bg-white/10 backdrop-blur-md w-56 border border-white/20'}`}>
                            <Search size={16} className={scrolled ? "text-gray-400" : "text-white/70"} />
                            <input
                                type="text"
                                placeholder="Search collection..."
                                className={`bg-transparent border-none outline-none text-xs font-bold ml-3 w-full placeholder:text-gray-400 ${!scrolled && 'text-white placeholder:text-white/50'}`}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onFocus={() => setIsSearching(true)}
                                onBlur={() => setTimeout(() => setIsSearching(false), 200)}
                            />
                        </div>

                        <button onClick={() => setIsCartOpen(true)} className={`relative p-3 rounded-full transition-all group ${scrolled ? 'hover:bg-red-50' : 'hover:bg-white/10'}`}>
                            <ShoppingBag size={22} className={`transition-colors ${scrolled ? 'text-gray-800 group-hover:text-red-800' : 'text-white'}`} />
                            {cart.length > 0 && (
                                <span className="absolute top-1 right-1 w-5 h-5 bg-red-800 text-white text-[10px] font-black flex items-center justify-center rounded-full border-2 border-white shadow-lg animate-in zoom-in">
                                    {cart.reduce((a, b) => a + b.qty, 0)}
                                </span>
                            )}
                        </button>

                        <button onClick={() => setIsMobileMenuOpen(true)} className={`lg:hidden p-3 rounded-full ${scrolled ? 'hover:bg-red-50 text-gray-800' : 'hover:bg-white/10 text-white'}`}>
                            <Menu size={24} />
                        </button>
                    </div>
                </div>
            </nav>

            {/* --- Hero Section --- */}
            <header className="relative h-[95vh] flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-black/30 z-10" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 z-10" />

                {/* Parallax Background */}
                <div className="absolute inset-0">
                    <img
                        src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=2500&auto=format&fit=crop"
                        className="w-full h-full object-cover animate-[kenburns_30s_linear_infinite]"
                        alt="Luxury Fashion"
                    />
                </div>

                <div className="relative z-20 text-center px-6 max-w-5xl mx-auto flex flex-col items-center">
                    <div className="animate-fade-in opacity-0" style={{ animationDelay: '0.2s' }}>
                        <div className="inline-flex items-center gap-3 px-6 py-2 bg-white/10 backdrop-blur-xl rounded-full border border-white/20 text-white text-[10px] font-black uppercase tracking-[0.3em] mb-8 shadow-2xl">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                            New Collection 2026
                        </div>
                    </div>

                    <h2 className="text-[12vw] lg:text-[7rem] font-black text-white mb-6 leading-[0.85] tracking-tighter drop-shadow-2xl font-playfair animate-slide-up opacity-0" style={{ animationDelay: '0.4s' }}>
                        ELEGANCE <br /> IN <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-200 via-amber-100 to-red-200">MOTION</span>
                    </h2>

                    <p className="text-lg md:text-xl text-gray-200 font-light mb-12 max-w-2xl mx-auto leading-relaxed drop-shadow-lg animate-slide-up opacity-0" style={{ animationDelay: '0.6s' }}>
                        Discover the epitome of Parisian modesty. Meticulously crafted abayas that blend timeless tradition with contemporary luxury.
                    </p>

                    <div className="flex flex-col md:flex-row gap-6 animate-slide-up opacity-0" style={{ animationDelay: '0.8s' }}>
                        <a href="#catalog" className="px-10 py-5 bg-white text-red-950 rounded-full font-black text-xs uppercase tracking-widest shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)] hover:bg-gray-100 hover:scale-105 transition-all duration-300">
                            Explore Collection
                        </a>
                        <a href="#about" className="px-10 py-5 bg-white/10 backdrop-blur-lg border border-white/20 text-white rounded-full font-black text-xs uppercase tracking-widest hover:bg-white/20 hover:scale-105 transition-all duration-300">
                            Our Atelier
                        </a>
                    </div>
                </div>

                {/* Scroll Indicator */}
                <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/50 animate-bounce">
                    <span className="text-[9px] uppercase tracking-widest">Scroll</span>
                    <ArrowRight className="rotate-90" size={16} />
                </div>
            </header>

            {/* --- Marquee --- */}
            <div className="bg-red-950 py-6 overflow-hidden whitespace-nowrap border-y border-red-900/50">
                <div className="inline-block animate-marquee">
                    {[...Array(10)].map((_, i) => (
                        <span key={i} className="text-white/20 text-4xl font-playfair font-black mx-12">PARIS ABAYA • LUXURY • MODESTY • ELEGANCE • </span>
                    ))}
                </div>
            </div>



            {/* --- Filter System --- */}
            <section id="catalog" className="sticky top-20 z-[40] bg-white/80 backdrop-blur-xl border-b border-gray-100/50 py-6">
                <div className="max-w-[1600px] mx-auto px-6 overflow-x-auto no-scrollbar">
                    <div className="flex justify-center min-w-max gap-3">
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={`px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 border ${selectedCategory === cat ? 'bg-red-900 text-white border-red-900 shadow-xl shadow-red-900/20 scale-105' : 'bg-white text-gray-400 border-gray-200 hover:border-red-200 hover:text-red-900'}`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>
            </section>

            {/* --- Product Grid --- */}
            <main className="max-w-[1600px] mx-auto px-6 md:px-12 py-24 min-h-[60vh]">
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-16">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                            <div key={i} className="animate-pulse">
                                <div className="aspect-[3/4.2] bg-gray-200 rounded-[2rem] mb-6" />
                                <div className="h-4 bg-gray-200 rounded-full w-2/3 mb-3" />
                                <div className="h-4 bg-gray-200 rounded-full w-1/3" />
                            </div>
                        ))}
                    </div>
                ) : filteredProducts.length === 0 ? (
                    <div className="py-40 text-center flex flex-col items-center animate-fade-in">
                        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-8">
                            <Search size={40} className="text-gray-400" />
                        </div>
                        <h3 className="text-3xl font-playfair font-black text-gray-900 mb-4">No Masterpieces Found</h3>
                        <p className="text-gray-500 font-medium max-w-md mx-auto mb-8">Your search for "{searchQuery}" didn't reveal any treasures. Please try a different term or category.</p>
                        <button onClick={() => { setSearchQuery(''); setSelectedCategory('All'); }} className="text-red-900 font-black text-xs uppercase tracking-widest border-b-2 border-red-900 pb-1 hover:text-red-700 transition-colors">Reset Gallery</button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-20">
                        {filteredProducts.map((product, idx) => (
                            <div key={product.id}
                                className="group relative animate-slide-up opacity-0"
                                style={{ animationDelay: `${idx * 0.1}s`, animationFillMode: 'forwards' }}
                                onClick={() => setSelectedProduct(product)}>

                                {/* Image Card */}
                                <div className="relative aspect-[3/4.2] overflow-hidden rounded-[2.5rem] bg-gray-100 mb-8 cursor-pointer">
                                    <div className="absolute inset-0 bg-gray-200 animate-pulse" /> {/* Loading Placeholder */}
                                    <img
                                        src={product.image_url}
                                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-[1.5s] ease-out group-hover:scale-110"
                                        alt={product.name}
                                        loading="lazy"
                                    />

                                    {/* Overlay */}
                                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                                    {/* Action Buttons Overlay */}
                                    <div className="absolute inset-0 flex items-center justify-center gap-4 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-4 group-hover:translate-y-0">
                                        <button className="h-12 px-8 bg-white/95 backdrop-blur-md text-red-950 rounded-full font-bold text-[10px] uppercase tracking-widest hover:bg-red-950 hover:text-white transition-all shadow-xl">
                                            Quick View
                                        </button>
                                    </div>

                                    {/* Badges */}
                                    <div className="absolute top-6 left-6 flex flex-col gap-2">
                                        {product.stock < 10 && (
                                            <span className="px-3 py-1 bg-red-600 text-white text-[9px] font-black uppercase tracking-widest rounded-md shadow-lg">
                                                Only {product.stock} left
                                            </span>
                                        )}
                                        {idx < 2 && (
                                            <span className="px-3 py-1 bg-white/90 backdrop-blur text-red-900 text-[9px] font-black uppercase tracking-widest rounded-md shadow-sm">
                                                Bestseller
                                            </span>
                                        )}
                                    </div>

                                    <button className="absolute top-6 right-6 w-10 h-10 bg-white/80 backdrop-blur rounded-full flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-white transition-all opacity-0 group-hover:opacity-100 transform translate-y-[-10px] group-hover:translate-y-0 duration-300">
                                        <Heart size={18} />
                                    </button>
                                </div>

                                {/* Info */}
                                <div className="px-2">
                                    <div className="flex justify-between items-start mb-2">
                                        <h4 className="text-lg font-bold text-gray-900 uppercase tracking-wide leading-tight group-hover:text-red-900 transition-colors w-2/3">
                                            {product.name}
                                        </h4>
                                        <span className="text-lg font-playfair font-black text-red-900">
                                            ${product.price}
                                        </span>
                                    </div>
                                    <p className="text-xs font-medium text-gray-400 mb-4 line-clamp-1">{product.description || "Premium Abaya Collection"}</p>

                                    <button
                                        onClick={(e) => { e.stopPropagation(); addToCart(product); }}
                                        className="w-full py-4 border border-gray-200 rounded-xl text-xs font-black uppercase tracking-widest text-gray-900 hover:bg-red-900 hover:text-white hover:border-red-900 transition-all flex items-center justify-center gap-2 group/btn"
                                    >
                                        <ShoppingBag size={14} />
                                        Add to Bag
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {/* --- About Section --- */}
            <section id="about" className="py-32 bg-[#fafafa]">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="flex flex-col md:flex-row items-center gap-16">
                        <div className="md:w-1/2 relative">
                            <div className="aspect-[4/5] rounded-[3rem] overflow-hidden">
                                <img src="https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=1200&auto=format&fit=crop" className="w-full h-full object-cover" alt="Atelier" />
                            </div>
                            <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-white p-4 rounded-full flex items-center justify-center animate-[spin_10s_linear_infinite]">
                                <svg viewBox="0 0 100 100" className="w-full h-full">
                                    <path id="curve" d="M 25, 50 a 25,25 0 1,1 50,0 a 25,25 0 1,1 -50,0" fill="transparent" />
                                    <text className="text-[14px] font-bold uppercase tracking-[0.2em] fill-red-900">
                                        <textPath href="#curve"> • Paris Abaya • Est 2024</textPath>
                                    </text>
                                </svg>
                            </div>
                        </div>
                        <div className="md:w-1/2">
                            <span className="text-red-900 text-xs font-black uppercase tracking-[0.4em] mb-6 block">The Atelier</span>
                            <h2 className="text-5xl md:text-6xl font-playfair font-black text-gray-900 mb-8 leading-tight">Crafting Modesty <br /><span className="text-gray-400">Since 2024</span></h2>
                            <p className="text-gray-500 font-medium leading-loose mb-8 text-lg">
                                At Paris Abaya, we believe that modesty is the ultimate sophistication. Our journey began in the heart of Mogadishu, inspired by the timeless elegance of Parisian couture.
                            </p>
                            <p className="text-gray-500 font-medium leading-loose mb-12 text-lg">
                                Each piece is meticulously designed to empower women, blending traditional values with contemporary aesthetics. We source only the finest fabrics, ensuring that every abaya is not just a garment, but a masterpiece.
                            </p>
                            <img src="https://upload.wikimedia.org/wikipedia/commons/e/e4/Signature_sample.svg" className="h-12 opacity-50" alt="Signature" />
                        </div>
                    </div>
                </div>
            </section>

            {/* --- Features Section --- */}
            <section className="bg-white py-32 border-t border-gray-100">
                <div className="max-w-[1400px] mx-auto px-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                        {[
                            { icon: <Star size={32} />, title: "Premium Fabrics", desc: "Sourced from the finest mills in Turkey and Dubai." },
                            { icon: <ShieldCheck size={32} />, title: "Secure Checkout", desc: "Your data is protected with 256-bit encryption." },
                            { icon: <Truck size={32} />, title: "Global Shipping", desc: "Express delivery to over 50 countries worldwide." }
                        ].map((feature, i) => (
                            <div key={i} className="flex flex-col items-center text-center p-8 bg-gray-50 rounded-[3rem] hover:bg-gray-100 transition-colors duration-500">
                                <div className="w-20 h-20 rounded-full bg-white shadow-xl flex items-center justify-center text-red-900 mb-8">
                                    {feature.icon}
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-4 font-playfair">{feature.title}</h3>
                                <p className="text-gray-500 leading-relaxed max-w-xs">{feature.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* --- Newsletter Section --- */}
            <section className="relative bg-red-950 py-40 px-6 overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-red-600/20 rounded-full blur-[120px] translate-x-1/2 -translate-y-1/2" />

                <div className="max-w-4xl mx-auto text-center relative z-10">
                    <span className="text-red-300 text-xs font-black uppercase tracking-[0.4em] mb-6 block">Stay Connected</span>
                    <h3 className="text-5xl md:text-7xl font-playfair font-black text-white mb-8">Join the Inner Circle</h3>
                    <p className="text-red-100/60 font-medium mb-16 text-lg max-w-2xl mx-auto leading-relaxed">
                        Subscribe to receive exclusive access to limited edition drops, private sales, and styling advice from our experts.
                    </p>

                    <div className="flex flex-col md:flex-row gap-4 max-w-xl mx-auto p-2 bg-white/5 backdrop-blur-lg border border-white/10 rounded-full">
                        <input
                            type="email"
                            placeholder="Your email address"
                            className="flex-1 px-8 py-4 bg-transparent text-white placeholder:text-white/30 outline-none font-bold text-sm"
                        />
                        <button className="px-12 py-4 bg-white text-red-950 rounded-full font-black text-xs uppercase tracking-widest hover:scale-105 transition-transform">
                            Subscribe
                        </button>
                    </div>
                </div>
            </section>

            {/* --- Contact Section --- */}
            <section id="contact" className="py-32 bg-white relative overflow-hidden">
                <div className="max-w-5xl mx-auto px-6 text-center relative z-10">
                    <span className="text-red-900 text-xs font-black uppercase tracking-[0.4em] mb-6 block">Get in Touch</span>
                    <h2 className="text-5xl md:text-6xl font-playfair font-black text-gray-900 mb-12">Visit Our Boutique</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
                        <div className="p-12 bg-gray-50 rounded-[3rem] text-center border border-gray-100">
                            <Phone className="w-10 h-10 text-red-900 mx-auto mb-6" size={40} />
                            <h4 className="text-xl font-bold font-playfair mb-2">Call Us Today</h4>
                            <p className="text-gray-400 text-sm font-bold uppercase tracking-widest mb-6">Mon-Fri, 9am - 9pm</p>
                            <a href="tel:0633825207" className="text-3xl font-black text-gray-900 hover:text-red-900 transition-colors">063 382 5207</a>
                        </div>
                        <div className="p-12 bg-red-900 text-white rounded-[3rem] text-center shadow-xl">
                            <MessageCircle className="w-10 h-10 text-white mx-auto mb-6" size={40} />
                            <h4 className="text-xl font-bold font-playfair mb-2">WhatsApp Support</h4>
                            <p className="text-white/60 text-sm font-bold uppercase tracking-widest mb-6">Start a Chat</p>
                            <a href="https://wa.me/252633825207" className="text-3xl font-black text-white hover:text-red-200 transition-colors">063 382 5207</a>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- Footer --- */}
            <footer className="bg-white pt-32 pb-12 border-t border-gray-100">
                <div className="max-w-[1600px] mx-auto px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-20 mb-20">
                    <div>
                        <h2 className="text-3xl font-playfair font-black text-red-900 mb-8">PARIS ABAYA</h2>
                        <p className="text-gray-400 font-medium leading-relaxed mb-8 max-w-xs">
                            Redefining modest fashion with a touch of Parisian elegance. Every piece tells a story of grace and dignity.
                        </p>
                        <div className="flex gap-4">
                            {['Instagram', 'Twitter', 'Facebook'].map(social => (
                                <a key={social} href="#" className="w-12 h-12 border border-gray-100 rounded-full flex items-center justify-center text-gray-400 hover:bg-red-900 hover:text-white hover:border-red-900 transition-all">
                                    <span className="sr-only">{social}</span>
                                    <Star size={16} /> {/* Placeholder Icon */}
                                </a>
                            ))}
                        </div>
                    </div>

                    {[
                        { title: "Collections", links: ["New Arrivals", "Best Sellers", "Essentials", "Accessories"] },
                        { title: "Customer Care", links: ["Shipping Policy", "Returns & Exchanges", "Size Guide", "FAQ"] },
                        { title: "Legal", links: ["Privacy Policy", "Terms of Service", "Cookie Policy", "Accessibility"] }
                    ].map((col, i) => (
                        <div key={i}>
                            <h4 className="text-xs font-black uppercase tracking-[0.2em] mb-10 text-gray-900">{col.title}</h4>
                            <ul className="space-y-6 text-sm font-bold text-gray-500">
                                {col.links.map(link => (
                                    <li key={link}><a href="#" className="hover:text-red-900 transition-colors hover:pl-2 duration-300 block">{link}</a></li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                <div className="max-w-[1600px] mx-auto px-6 pt-12 border-t border-gray-50 flex flex-col md:flex-row justify-between items-center gap-6">
                    <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">© 2026 Paris Abaya. All rights reserved.</p>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">System Operational</span>
                    </div>
                </div>
            </footer>

            {/* --- Quick View Modal --- */}
            {selectedProduct && (
                <div className="fixed inset-0 z-[150] flex items-center justify-center px-6 bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
                    <div
                        className="bg-white w-full max-w-6xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh] relative"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={() => { setSelectedProduct(null); setSelectedSize(''); }}
                            className="absolute top-6 right-6 z-10 w-12 h-12 bg-white/50 backdrop-blur rounded-full flex items-center justify-center text-gray-900 hover:bg-white transition-all"
                        >
                            <X size={24} />
                        </button>

                        <div className="md:w-1/2 bg-gray-100 relative">
                            <img src={selectedProduct.image_url} className="w-full h-full object-cover" alt="" />
                        </div>

                        <div className="md:w-1/2 p-12 md:p-20 flex flex-col h-full overflow-y-auto custom-scrollbar">
                            <div className="mb-auto">
                                <span className="text-red-900 text-[10px] font-black uppercase tracking-[0.3em] mb-4 block">{selectedProduct.category}</span>
                                <h3 className="text-5xl font-playfair font-black text-gray-900 mb-6 leading-none">{selectedProduct.name}</h3>
                                <p className="text-3xl font-bold text-gray-900 mb-12">${selectedProduct.price}</p>

                                <div className="space-y-12">
                                    <div>
                                        <h4 className="text-xs font-black text-gray-900 uppercase tracking-widest mb-4">Description</h4>
                                        <p className="text-gray-500 leading-relaxed font-medium">{selectedProduct.description || "Crafted with precision and care, this piece embodies the essence of luxury modest fashion."}</p>
                                    </div>

                                    <div>
                                        <div className="flex justify-between items-center mb-6">
                                            <h4 className="text-xs font-black text-gray-900 uppercase tracking-widest">Select Size</h4>
                                            <button className="text-[10px] font-bold text-gray-400 uppercase underline decoration-gray-300 underline-offset-4 hover:text-red-900 transition-colors">Size Guide</button>
                                        </div>
                                        <div className="flex flex-wrap gap-3">
                                            {(selectedProduct.sizes || ['Standard', 'S', 'M', 'L']).map(size => (
                                                <button
                                                    key={size}
                                                    onClick={() => setSelectedSize(size)}
                                                    className={`w-14 h-14 rounded-full text-xs font-black transition-all flex items-center justify-center ${selectedSize === size ? 'bg-red-900 text-white shadow-xl scale-110' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}
                                                >
                                                    {size}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-12 pt-12 border-t border-gray-100">
                                <button
                                    onClick={() => addToCart(selectedProduct, selectedSize)}
                                    className="w-full py-6 bg-red-900 text-white rounded-full font-black text-sm uppercase tracking-widest shadow-2xl shadow-red-900/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                                >
                                    <ShoppingBag size={20} />
                                    Add to Bag - ${(selectedProduct.price * 1).toFixed(2)}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* --- Cart Drawer --- */}
            <div className={`fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl z-[200] transform transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${isCartOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                <div className="h-full flex flex-col">
                    <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-white/80 backdrop-blur-xl absolute top-0 w-full z-10">
                        <span className="text-xl font-playfair font-black text-gray-900">Your Bag ({cart.reduce((a, b) => a + b.qty, 0)})</span>
                        <button onClick={() => setIsCartOpen(false)} className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-500 hover:bg-red-50 hover:text-red-900 transition-all"><X size={20} /></button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-8 pt-32 space-y-8 no-scrollbar bg-[#fafafa]">
                        {cart.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-center opacity-40 pb-20">
                                <ShoppingBag size={64} className="text-gray-300 mb-6" />
                                <p className="font-bold text-gray-400 uppercase tracking-widest text-xs">Your bag is empty</p>
                            </div>
                        ) : (
                            cart.map(item => (
                                <div key={item.cartKey} className="flex gap-6 bg-white p-4 rounded-3xl shadow-sm border border-gray-100">
                                    <div className="w-20 h-24 rounded-2xl bg-gray-50 overflow-hidden shrink-0">
                                        <img src={item.image_url} className="w-full h-full object-cover" alt="" />
                                    </div>
                                    <div className="flex-1 flex flex-col justify-between py-1">
                                        <div>
                                            <h4 className="font-bold text-gray-900 text-sm mb-1 line-clamp-1">{item.name}</h4>
                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wide">Size: {item.selectedSize}</p>
                                        </div>
                                        <div className="flex justify-between items-end">
                                            <span className="font-bold text-red-900">${(item.price * item.qty).toFixed(2)}</span>
                                            <button onClick={() => removeFromCart(item.cartKey)} className="text-[10px] font-bold text-gray-300 uppercase hover:text-red-500 transition-colors">Remove</button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {cart.length > 0 && (
                        <div className="p-8 border-t border-gray-50 bg-white">
                            <div className="flex justify-between items-center mb-6">
                                <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Subtotal</span>
                                <span className="text-2xl font-black text-gray-900">${cartTotal.toFixed(2)}</span>
                            </div>
                            <button
                                onClick={() => { setIsCartOpen(false); setIsCheckoutOpen(true); }}
                                className="w-full py-5 bg-gray-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-red-900 transition-colors flex items-center justify-center gap-3"
                            >
                                Checkout
                                <ArrowRight size={16} />
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* --- Checkout Modal --- */}
            {isCheckoutOpen && (
                <div className="fixed inset-0 z-[250] flex items-center justify-center p-6 bg-red-950/20 backdrop-blur-xl animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in duration-300 border border-white/50">
                        {orderStep === 'form' ? (
                            <form onSubmit={handleCheckout} className="p-10">
                                <div className="text-center mb-10">
                                    <h3 className="text-2xl font-playfair font-black text-gray-900 mb-2">Secure Checkout</h3>
                                    <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">Complete your order</p>
                                </div>

                                <div className="space-y-5">
                                    <div className="bg-gray-50 rounded-2xl px-5 py-3 border border-gray-100 focus-within:border-red-200 focus-within:bg-white transition-all">
                                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Full Name</label>
                                        <input
                                            required
                                            className="w-full bg-transparent font-bold text-gray-900 placeholder:text-gray-300 outline-none text-sm"
                                            value={customerInfo.name}
                                            onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                                            placeholder="e.g. Jane Doe"
                                        />
                                    </div>
                                    <div className="bg-gray-50 rounded-2xl px-5 py-3 border border-gray-100 focus-within:border-red-200 focus-within:bg-white transition-all">
                                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Phone</label>
                                        <input
                                            required type="tel"
                                            className="w-full bg-transparent font-bold text-gray-900 placeholder:text-gray-300 outline-none text-sm"
                                            value={customerInfo.phone}
                                            onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                                            placeholder="e.g. +252 61..."
                                        />
                                    </div>
                                    <div className="bg-gray-50 rounded-2xl px-5 py-3 border border-gray-100 focus-within:border-red-200 focus-within:bg-white transition-all">
                                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Address</label>
                                        <input
                                            required
                                            className="w-full bg-transparent font-bold text-gray-900 placeholder:text-gray-300 outline-none text-sm"
                                            value={customerInfo.address}
                                            onChange={(e) => setCustomerInfo({ ...customerInfo, address: e.target.value })}
                                            placeholder="Street, City, Region"
                                        />
                                    </div>

                                    <div className="pt-6">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2 block mb-3">Payment Method</label>
                                        <div className="grid grid-cols-3 gap-3">
                                            {['ZAAD-USD', 'EDAHAB', 'CASH'].map(method => (
                                                <button
                                                    key={method}
                                                    type="button"
                                                    onClick={() => setCustomerInfo({ ...customerInfo, paymentMethod: method })}
                                                    className={`py-3 rounded-xl text-[10px] font-black uppercase transition-all border ${customerInfo.paymentMethod === method ? 'bg-red-900 text-white border-red-900' : 'bg-white text-gray-400 border-gray-200 hover:border-red-200'}`}
                                                >
                                                    {method}
                                                </button>
                                            ))}
                                        </div>
                                        <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-100/50 text-[10px] text-gray-500 leading-relaxed font-bold">
                                            <p className="mb-2 text-red-900">wxaad lacagta kusoo dirtaa numberadaa:</p>
                                            <p>1. Zaad Dollar *880* 0619515398*lacagata#</p>
                                            <p>2. Edahab Dollar *110*0653825207*lacagata#</p>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="w-full mt-10 py-5 bg-red-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-red-800 transition-all flex items-center justify-center gap-2"
                                >
                                    {processing ? 'Processing...' : `Pay $${cartTotal.toFixed(2)}`}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsCheckoutOpen(false)}
                                    className="w-full mt-4 py-3 text-gray-400 text-[10px] font-black uppercase tracking-widest hover:text-gray-900"
                                >
                                    Cancel Transaction
                                </button>
                            </form>
                        ) : (
                            <div className="p-16 text-center flex flex-col items-center">
                                <div className="w-20 h-20 bg-green-50 text-green-600 rounded-full flex items-center justify-center mb-8 animate-bounce">
                                    <CheckCircle2 size={40} />
                                </div>
                                <h3 className="text-2xl font-playfair font-black text-gray-900 mb-4">Order Confirmed</h3>
                                <p className="text-gray-500 text-sm font-medium mb-10 max-w-xs leading-relaxed">Thank you, {customerInfo.name}. We have received your order and will contact you shortly.</p>

                                <button
                                    onClick={() => { setIsCheckoutOpen(false); setOrderStep('form'); }}
                                    className="w-full py-5 bg-gray-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-gray-800 transition-all"
                                >
                                    Return to Store
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* --- Backdrop --- */}
            {(isCartOpen || isCheckoutOpen || isMobileMenuOpen || selectedProduct) && (
                <div
                    className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[90] transition-opacity"
                    onClick={() => {
                        setIsCartOpen(false);
                        setIsCheckoutOpen(false);
                        setIsMobileMenuOpen(false);
                        setSelectedProduct(null);
                        setSelectedSize('');
                    }}
                />
            )}
        </div>
    );
};

export default Storefront;
