import React, { useState, useEffect, useMemo } from 'react';
import { ShoppingBag, Search, Menu, X, Instagram, Facebook, ArrowRight, Star, Heart, CheckCircle2, ShieldCheck, Truck, RotateCcw } from 'lucide-react';
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
    }, []);

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
        if (!size && product.sizes?.length > 0) {
            setSelectedProduct(product);
            return;
        }

        setCart(prev => {
            const cartKey = `${product.id}-${size || 'Standard'}`;
            const exists = prev.find(item => item.cartKey === cartKey);
            if (exists) {
                return prev.map(item => item.cartKey === cartKey ? { ...item, qty: item.qty + 1 } : item);
            }
            return [...prev, { ...product, cartKey, selectedSize: size || 'Standard', qty: 1 }];
        });
        setIsCartOpen(true);
        setSelectedProduct(null);
        setSelectedSize('');
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
        <div className="min-h-screen bg-[#fafafa] font-['Outfit'] text-gray-900 scroll-smooth">
            {/* --- Navigation --- */}
            <nav className="fixed top-0 w-full z-50 bg-white/90 backdrop-blur-xl border-b border-gray-100 transition-all">
                <div className="max-w-[1440px] mx-auto px-6 h-20 flex justify-between items-center">
                    <div className="flex items-center gap-12">
                        <h1 onClick={() => { setSelectedCategory('All'); setSearchQuery(''); }} className="text-2xl font-black tracking-tighter text-red-800 cursor-pointer">PARIS ABAYA</h1>
                        <div className="hidden lg:flex gap-8 text-[11px] font-black uppercase tracking-[0.2em] text-gray-400">
                            {['Home', 'Catalog', 'Collections', 'About'].map(item => (
                                <a key={item} href={`#${item.toLowerCase()}`} className="hover:text-red-600 transition-colors">{item}</a>
                            ))}
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Desktop Search */}
                        <div className={`hidden md:flex items-center bg-gray-50 border border-gray-100 rounded-full px-4 py-2 transition-all ${isSearching ? 'w-64 ring-2 ring-red-100' : 'w-48'}`}>
                            <Search size={16} className="text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search collection..."
                                className="bg-transparent border-none outline-none text-xs font-bold ml-2 w-full placeholder:text-gray-300"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onFocus={() => setIsSearching(true)}
                                onBlur={() => setTimeout(() => setIsSearching(false), 200)}
                            />
                        </div>

                        <button onClick={() => setIsCartOpen(true)} className="relative p-2.5 hover:bg-red-50 rounded-full transition-all group">
                            <ShoppingBag size={22} className="text-gray-700 group-hover:text-red-800" />
                            {cart.length > 0 && (
                                <span className="absolute top-1 right-1 w-5 h-5 bg-red-800 text-white text-[10px] font-black flex items-center justify-center rounded-full border-2 border-white shadow-lg animate-in zoom-in">
                                    {cart.reduce((a, b) => a + b.qty, 0)}
                                </span>
                            )}
                        </button>

                        <button onClick={() => setIsMobileMenuOpen(true)} className="lg:hidden p-2.5 hover:bg-red-50 rounded-full"><Menu size={22} /></button>
                    </div>
                </div>
            </nav>

            {/* --- Hero Section --- */}
            <section id="home" className="relative h-screen flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/20 z-10" />
                <img
                    src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=2000&auto=format&fit=crop"
                    className="absolute inset-0 w-full h-full object-cover scale-105 animate-[kenburns_40s_linear_infinite]"
                    alt="Luxury Fashion"
                />
                <div className="relative z-20 text-center px-6">
                    <div className="inline-flex items-center gap-2 px-6 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20 text-white text-[10px] font-black uppercase tracking-[0.4em] mb-8 animate-in slide-in-from-top-12 duration-1000">
                        Spring / Summer 2026
                    </div>
                    <h2 className="text-[12vw] md:text-8xl font-black text-white mb-8 leading-[0.85] tracking-tighter drop-shadow-2xl">
                        SILK & <br /> <span className="text-transparent border-t-0 bg-clip-text bg-gradient-to-r from-red-400 to-amber-200">MAJESTY</span>
                    </h2>
                    <p className="text-lg md:text-2xl text-white/90 font-medium mb-12 max-w-2xl mx-auto leading-relaxed drop-shadow-lg">
                        Unveiling the essence of Parisian Modesty. Hand-stitched with the world's most premium fabrics.
                    </p>
                    <a href="#catalog" className="inline-flex items-center gap-4 px-12 py-6 bg-red-800 text-white rounded-full font-black text-sm uppercase tracking-widest shadow-2xl shadow-red-900/40 hover:bg-red-700 hover:-translate-y-1 transition-all group">
                        Explore Collection
                        <ArrowRight className="group-hover:translate-x-2 transition-transform" />
                    </a>
                </div>
            </section>

            {/* --- Trust Badges --- */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 px-6 py-12 bg-white border-b border-gray-100">
                {[
                    { icon: <CheckCircle2 className="text-emerald-600" />, label: "Premium Quality", sub: "100% Original Fabrics" },
                    { icon: <Truck className="text-blue-600" />, label: "Secure Delivery", sub: "To your doorstep" },
                    { icon: <ShieldCheck className="text-red-800" />, label: "Authentic Design", sub: "By Parisian Craftsmen" },
                    { icon: <RotateCcw className="text-amber-600" />, label: "Easy Exchange", sub: "7-Day Return Policy" }
                ].map((item, i) => (
                    <div key={i} className="flex flex-col items-center text-center">
                        <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center mb-4">{item.icon}</div>
                        <h4 className="text-sm font-black uppercase tracking-widest leading-none mb-1">{item.label}</h4>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{item.sub}</p>
                    </div>
                ))}
            </div>

            {/* --- Filter System --- */}
            <section id="catalog" className="sticky top-20 z-[40] bg-white/70 backdrop-blur-md border-b border-gray-100">
                <div className="max-w-[1440px] mx-auto px-6 py-4 flex items-center justify-center gap-3 overflow-x-auto no-scrollbar">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={`px-8 py-2.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] transition-all whitespace-nowrap shadow-sm ${selectedCategory === cat ? 'bg-red-800 text-white shadow-red-900/20' : 'bg-white text-gray-400 border border-gray-100 hover:border-red-200'}`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </section>

            {/* --- Product Grid --- */}
            <main className="max-w-[1440px] mx-auto px-6 py-20 min-h-[60vh]">
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                            <div key={i} className="animate-pulse">
                                <div className="aspect-[3/4.5] bg-gray-200 rounded-[2.5rem] mb-6" />
                                <div className="h-4 bg-gray-200 rounded-full w-2/3 mb-3" />
                                <div className="h-4 bg-gray-200 rounded-full w-1/3" />
                            </div>
                        ))}
                    </div>
                ) : filteredProducts.length === 0 ? (
                    <div className="py-40 text-center flex flex-col items-center animate-in fade-in zoom-in">
                        <Search size={64} className="text-gray-100 mb-6" />
                        <h3 className="text-2xl font-black text-gray-300 uppercase tracking-widest">Mystery Collection</h3>
                        <p className="text-gray-400 font-bold mt-2">Try searching for something else or browse all products.</p>
                        <button onClick={() => { setSearchQuery(''); setSelectedCategory('All'); }} className="mt-8 text-red-800 font-black text-xs uppercase tracking-widest underline underline-offset-8">Reset Gallery</button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
                        {filteredProducts.map(product => (
                            <div key={product.id} className="group relative" onClick={() => setSelectedProduct(product)}>
                                <div className="relative aspect-[3/4.5] overflow-hidden rounded-[3rem] bg-gray-100 mb-6 cursor-pointer shadow-sm hover:shadow-2xl hover:shadow-red-900/10 transition-all duration-700">
                                    <img
                                        src={product.image_url}
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
                                        alt={product.name}
                                    />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-center justify-center p-8">
                                        <div className="w-full h-full border-2 border-white/20 rounded-[2rem] flex flex-col items-center justify-center gap-4 transform translate-y-10 group-hover:translate-y-0 transition-transform duration-500">
                                            <button className="w-48 py-4 bg-white text-red-900 rounded-full font-black text-[10px] uppercase tracking-widest hover:bg-red-800 hover:text-white transition-all">Quick View</button>
                                            <p className="text-white text-[10px] font-black uppercase tracking-widest">Detail View</p>
                                        </div>
                                    </div>
                                    <div className="absolute top-8 left-8 flex flex-col gap-2">
                                        {product.stock < 10 && <span className="px-4 py-1.5 bg-red-800 text-white text-[9px] font-black uppercase tracking-widest rounded-full shadow-lg">Low Stock</span>}
                                        <span className="px-4 py-1.5 bg-white/90 backdrop-blur text-[9px] font-black uppercase tracking-widest rounded-full text-red-900 shadow-sm">{product.category}</span>
                                    </div>
                                    <button className="absolute top-8 right-8 w-10 h-10 bg-white/50 backdrop-blur rounded-full flex items-center justify-center text-white hover:text-red-600 hover:bg-white transition-all opacity-0 group-hover:opacity-100"><Heart size={18} /></button>
                                </div>
                                <div className="px-4">
                                    <h4 className="text-xl font-black text-gray-900 mb-1 uppercase tracking-tight truncate group-hover:text-red-700 transition-colors">{product.name}</h4>
                                    <div className="flex items-center justify-between">
                                        <div className="flex flex-col">
                                            <span className="text-2xl font-black text-red-950">${product.price.toLocaleString()}</span>
                                            {product.stock > 0 && <span className="text-[10px] text-emerald-600 font-black uppercase tracking-widest">In Stock</span>}
                                        </div>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); addToCart(product); }}
                                            className="w-12 h-12 bg-red-50 text-red-800 rounded-2xl flex items-center justify-center hover:bg-red-800 hover:text-white transition-all"
                                        >
                                            <ShoppingBag size={20} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {/* --- Newsletter Section --- */}
            <section className="bg-red-950 py-32 px-6 overflow-hidden relative">
                <div className="absolute top-0 right-0 w-96 h-96 bg-red-800/10 rounded-full blur-[100px] translate-x-1/2 -translate-y-1/2" />
                <div className="max-w-4xl mx-auto text-center relative z-10">
                    <h3 className="text-4xl md:text-6xl font-black text-white mb-6 uppercase tracking-tight">Join the Inner Circle</h3>
                    <p className="text-red-200/60 font-medium mb-12 text-lg">Receive exclusive previews, styling advice, and early access to new collections.</p>
                    <div className="flex flex-col md:flex-row gap-4 max-w-lg mx-auto">
                        <input
                            type="email"
                            placeholder="Your email address"
                            className="flex-1 px-8 py-5 bg-white/10 border border-white/20 rounded-full text-white placeholder:text-red-300/30 outline-none focus:bg-white/20 transition-all font-bold"
                        />
                        <button className="px-10 py-5 bg-white text-red-950 rounded-full font-black text-xs uppercase tracking-widest hover:bg-red-100 transition-all">Subscribe</button>
                    </div>
                </div>
            </section>

            {/* --- Footer --- */}
            <footer className="bg-white px-6 pt-32 pb-12 border-t border-gray-100">
                <div className="max-w-[1440px] mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16 mb-20">
                    <div>
                        <h2 className="text-2xl font-black tracking-tighter text-red-800 mb-8">PARIS ABAYA</h2>
                        <p className="text-gray-400 font-medium leading-relaxed mb-8">Crafting elegance since 2012. Our mission is to provide the highest quality modest fashion for the modern woman.</p>
                        <div className="flex gap-4">
                            <a href="#" className="w-10 h-10 border border-gray-100 rounded-full flex items-center justify-center text-gray-400 hover:bg-red-50 hover:text-red-800 hover:border-red-100 transition-all"><Instagram size={18} /></a>
                            <a href="#" className="w-10 h-10 border border-gray-100 rounded-full flex items-center justify-center text-gray-400 hover:bg-red-50 hover:text-red-800 hover:border-red-100 transition-all"><Facebook size={18} /></a>
                        </div>
                    </div>
                    <div>
                        <h4 className="text-xs font-black uppercase tracking-[0.2em] mb-8">Collections</h4>
                        <ul className="space-y-4 text-sm font-bold text-gray-400">
                            {categories.slice(1, 5).map(cat => <li key={cat}><a href="#" className="hover:text-red-800 transition-colors uppercase tracking-widest text-[10px]">{cat}</a></li>)}
                        </ul>
                    </div>
                    <div>
                        <h4 className="text-xs font-black uppercase tracking-[0.2em] mb-8">Help</h4>
                        <ul className="space-y-4 text-sm font-bold text-gray-400">
                            <li><a href="#" className="hover:text-red-800 transition-colors uppercase tracking-widest text-[10px]">Shipping Policy</a></li>
                            <li><a href="#" className="hover:text-red-800 transition-colors uppercase tracking-widest text-[10px]">Returns & Exchanges</a></li>
                            <li><a href="#" className="hover:text-red-800 transition-colors uppercase tracking-widest text-[10px]">Size Guide</a></li>
                            <li><a href="#" className="hover:text-red-800 transition-colors uppercase tracking-widest text-[10px]">FAQ</a></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="text-xs font-black uppercase tracking-[0.2em] mb-8">Our Studio</h4>
                        <p className="text-gray-400 font-medium leading-relaxed mb-4 text-sm">Avenue de l'Opéra<br />75001 Paris, France</p>
                        <p className="text-gray-900 font-black text-sm">+252 61 XXX XXXX</p>
                    </div>
                </div>
                <div className="max-w-[1440px] mx-auto pt-12 border-t border-gray-50 flex flex-col md:flex-row justify-between items-center gap-6">
                    <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">© 2026 Paris Abaya. All rights reserved.</p>
                    <div className="flex gap-8 text-[10px] font-bold text-gray-300 uppercase tracking-widest">
                        <a href="#">Privacy</a>
                        <a href="#">Terms</a>
                        <a href="#">Cookies</a>
                    </div>
                </div>
            </footer>

            {/* --- Quick View Modal --- */}
            {selectedProduct && (
                <div className="fixed inset-0 z-[150] flex items-center justify-center px-6 bg-red-950/20 backdrop-blur-xl">
                    <div className="bg-white w-full max-w-5xl rounded-[3.5rem] shadow-2xl overflow-hidden flex flex-col md:flex-row animate-in zoom-in duration-300 max-h-[90vh]">
                        <div className="md:w-1/2 bg-gray-50 overflow-hidden h-[40vh] md:h-auto">
                            <img src={selectedProduct.image_url} className="w-full h-full object-cover" alt="" />
                        </div>
                        <div className="md:w-1/2 p-8 md:p-16 flex flex-col h-full overflow-y-auto">
                            <div className="flex justify-between items-start mb-8">
                                <span className="px-6 py-2 bg-red-50 text-red-800 rounded-full text-[10px] font-black uppercase tracking-[0.2em]">{selectedProduct.category}</span>
                                <button onClick={() => { setSelectedProduct(null); setSelectedSize(''); }} className="p-3 bg-gray-50 hover:bg-red-50 text-gray-400 hover:text-red-800 rounded-full transition-all"><X size={24} /></button>
                            </div>
                            <h3 className="text-4xl font-black text-gray-900 mb-4 tracking-tight uppercase leading-none">{selectedProduct.name}</h3>
                            <p className="text-3xl font-black text-red-950 mb-10">${selectedProduct.price.toLocaleString()}</p>

                            <div className="space-y-10 flex-1">
                                <div>
                                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-4">Description</h4>
                                    <p className="text-gray-500 font-medium leading-relaxed">{selectedProduct.description || "A masterpiece of luxury and modesty, this abaya is crafted from premium breathable fabric, ensuring you look regal for any occasion."}</p>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Select Size</h4>
                                        <a href="#" className="text-[10px] font-black text-red-800 uppercase underline underline-offset-4">Size Guide</a>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {(selectedProduct.sizes || ['Standard', 'S', 'M', 'L']).map(size => (
                                            <button
                                                key={size}
                                                onClick={() => setSelectedSize(size)}
                                                className={`px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${selectedSize === size ? 'bg-red-800 text-white shadow-xl' : 'bg-gray-50 text-gray-400 hover:bg-white hover:border-red-200 border border-transparent'}`}
                                            >
                                                {size}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={() => addToCart(selectedProduct, selectedSize)}
                                className="w-full py-6 mt-12 bg-red-800 text-white rounded-[2rem] font-black text-lg shadow-2xl shadow-red-900/10 hover:bg-red-700 hover:-translate-y-1 transition-all flex items-center justify-center gap-4 group"
                            >
                                <ShoppingBag size={24} />
                                Add to Bag
                                <ArrowRight className="group-hover:translate-x-2 transition-transform" />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- Cart Drawer --- */}
            <div className={`fixed inset-y-0 right-0 w-full max-w-lg bg-white shadow-2xl z-[200] transform transition-transform duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] ${isCartOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                <div className="h-full flex flex-col">
                    <div className="p-10 border-b border-gray-100 flex justify-between items-center">
                        <div>
                            <h3 className="text-2xl font-black tracking-tight uppercase">My Bag</h3>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">{cart.length} Masterpieces</p>
                        </div>
                        <button onClick={() => setIsCartOpen(false)} className="p-4 hover:bg-red-50 rounded-full transition-all text-gray-300 hover:text-red-800"><X size={28} /></button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-10 space-y-10 no-scrollbar">
                        {cart.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                                <ShoppingBag size={80} strokeWidth={1} className="text-gray-100 mb-8" />
                                <p className="font-black text-gray-400 uppercase tracking-widest">Bag is Empty</p>
                            </div>
                        ) : (
                            cart.map(item => (
                                <div key={item.cartKey} className="group flex gap-8">
                                    <div className="w-28 h-40 rounded-[2rem] bg-gray-50 overflow-hidden shrink-0 shadow-sm transition-transform group-hover:scale-105 duration-500">
                                        <img src={item.image_url} className="w-full h-full object-cover" alt="" />
                                    </div>
                                    <div className="flex-1 py-4 flex flex-col justify-between">
                                        <div>
                                            <h4 className="text-lg font-black text-gray-900 uppercase leading-none mb-2 truncate max-w-[200px]">{item.name}</h4>
                                            <div className="flex gap-4">
                                                <span className="text-[10px] font-black text-red-800 uppercase tracking-widest px-3 py-1 bg-red-50 rounded-full">Size: {item.selectedSize}</span>
                                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-3 py-1 bg-gray-50 rounded-full">Qty: {item.qty}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-xl font-black text-red-950">${(item.price * item.qty).toLocaleString()}</span>
                                            <button onClick={() => removeFromCart(item.cartKey)} className="text-[10px] font-black text-red-600 uppercase tracking-widest hover:underline decoration-2 underline-offset-4">Remove Item</button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {cart.length > 0 && (
                        <div className="p-10 border-t border-gray-100 bg-gray-50/50">
                            <div className="flex justify-between items-center mb-8">
                                <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Total Valuation</span>
                                <span className="text-4xl font-black text-red-950">${cartTotal.toLocaleString()}</span>
                            </div>
                            <button
                                onClick={() => { setIsCartOpen(false); setIsCheckoutOpen(true); }}
                                className="w-full py-7 bg-red-800 text-white rounded-[2.5rem] font-black text-lg shadow-2xl shadow-red-900/20 hover:bg-red-700 hover:-translate-y-1 transition-all flex items-center justify-center gap-4"
                            >
                                Process Checkout
                                <ArrowRight size={24} />
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* --- Checkout Modal --- */}
            {isCheckoutOpen && (
                <div className="fixed inset-0 z-[250] flex items-center justify-center p-6 bg-red-950/20 backdrop-blur-xl">
                    <div className="bg-white w-full max-w-xl rounded-[4rem] shadow-2xl overflow-hidden animate-in zoom-in duration-500">
                        {orderStep === 'form' ? (
                            <form onSubmit={handleCheckout} className="p-12 md:p-16">
                                <h3 className="text-4xl font-black text-gray-900 mb-2 uppercase tracking-tight">Delivery Info</h3>
                                <p className="text-gray-400 font-medium mb-10">Where should we deliver your masterpieces?</p>

                                <div className="space-y-6">
                                    <input
                                        required placeholder="Full Legal Name"
                                        className="w-full px-8 py-5 bg-gray-50 border border-gray-100 rounded-[2rem] focus:bg-white focus:border-red-500 transition-all font-bold outline-none"
                                        value={customerInfo.name}
                                        onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                                    />
                                    <input
                                        required type="tel" placeholder="Primary Phone Number"
                                        className="w-full px-8 py-5 bg-gray-50 border border-gray-100 rounded-[2rem] focus:bg-white focus:border-red-500 transition-all font-bold outline-none"
                                        value={customerInfo.phone}
                                        onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                                    />
                                    <textarea
                                        required rows="3" placeholder="Full Delivery Address"
                                        className="w-full px-8 py-5 bg-gray-50 border border-gray-100 rounded-[2rem] focus:bg-white focus:border-red-500 transition-all font-bold outline-none resize-none"
                                        value={customerInfo.address}
                                        onChange={(e) => setCustomerInfo({ ...customerInfo, address: e.target.value })}
                                    />

                                    <div className="pt-6">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-4 block mb-4">Select Payment Portal</label>
                                        <div className="grid grid-cols-3 gap-3">
                                            {['ZAAD-USD', 'EDAHAB-USD', 'CASH'].map(method => (
                                                <button
                                                    key={method}
                                                    type="button"
                                                    onClick={() => setCustomerInfo({ ...customerInfo, paymentMethod: method })}
                                                    className={`py-4 rounded-2xl text-[10px] font-black uppercase transition-all ${customerInfo.paymentMethod === method ? 'bg-red-800 text-white shadow-lg' : 'bg-gray-50 text-gray-400 border border-gray-100'}`}
                                                >
                                                    {method}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-12 flex flex-col md:flex-row gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setIsCheckoutOpen(false)}
                                        className="flex-1 py-5 bg-gray-100 text-gray-500 rounded-full font-black uppercase tracking-widest text-[10px] hover:bg-gray-200 transition-all"
                                    >
                                        Back to Bag
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="flex-[2] py-5 bg-red-800 text-white rounded-full font-black text-lg shadow-2xl shadow-red-900/20 hover:bg-red-700 hover:-translate-y-1 transition-all"
                                    >
                                        {processing ? 'Connecting...' : 'Secure Order'}
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <div className="p-20 text-center flex flex-col items-center">
                                <div className="w-24 h-24 bg-red-50 text-red-800 rounded-full flex items-center justify-center mb-10 animate-bounce">
                                    <CheckCircle2 size={56} strokeWidth={1} />
                                </div>
                                <h3 className="text-4xl font-black text-gray-900 mb-6 uppercase tracking-tight">Order Confirmed</h3>
                                <p className="text-gray-500 font-medium mb-12 text-lg">Thank you for your trust. Our concierge team will contact you at <strong>{customerInfo.phone}</strong> to confirm delivery.</p>

                                <div className="w-full bg-gray-50 rounded-[3rem] p-10 mb-12 text-left border border-gray-100 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-8 opacity-5"><Star size={80} fill="currentColor" /></div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-6">Manifest Summary</p>
                                    <div className="space-y-4">
                                        {lastOrder?.items.map((item, idx) => (
                                            <div key={idx} className="flex justify-between items-center text-sm">
                                                <div className="flex flex-col">
                                                    <span className="font-black text-gray-800">{item.name}</span>
                                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Masterpiece x{item.qty} • Size {item.size}</span>
                                                </div>
                                                <span className="font-black text-gray-900">${(item.price * item.qty).toLocaleString()}</span>
                                            </div>
                                        ))}
                                        <div className="pt-6 border-t border-gray-200 mt-4 flex justify-between items-center">
                                            <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Final Total</span>
                                            <span className="text-3xl font-black text-red-950">${lastOrder?.total.toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={() => { setIsCheckoutOpen(false); setOrderStep('form'); }}
                                    className="w-full py-6 bg-red-800 text-white rounded-full font-black text-lg shadow-2xl shadow-red-900/20 hover:bg-red-700 transition-all font-outfit"
                                >
                                    Return to Gallery
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* --- Backdrop --- */}
            {(isCartOpen || isCheckoutOpen || isMobileMenuOpen || selectedProduct) && (
                <div
                    className="fixed inset-0 bg-red-950/30 backdrop-blur-md z-[90] transition-opacity"
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
