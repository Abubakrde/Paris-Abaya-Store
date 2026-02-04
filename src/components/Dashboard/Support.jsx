import React, { useState } from 'react';
import {
    HelpCircle, Book, MessageSquare, Ticket,
    ChevronRight, ExternalLink, Search, Mail,
    Phone, Clock, CheckCircle2, AlertCircle
} from 'lucide-react';

const Support = () => {
    const [searchQuery, setSearchQuery] = useState('');

    const faqs = [
        {
            q: "How do I process a refund?",
            a: "To process a refund, go to the Bills tab, find the invoice, and use the 'Refund' option in the actions menu. Note that only Admins can process refunds."
        },
        {
            q: "How to add a new category?",
            a: "If you are an Admin, you can see the 'Categories' item in the sidebar. Click it and use the 'Add Category' button."
        },
        {
            q: "Can I export my sales data?",
            a: "Yes! Go to the Analytics or Reports section and click the 'CSV' or 'Full Report (PDF)' button to download your data."
        },
        {
            q: "How do I update stock levels?",
            a: "In the Inventory tab, click the 'Edit' icon on any product to update its current stock or details."
        }
    ];

    const resources = [
        { title: "User Manual", desc: "Detailed guide for staff and admins.", icon: Book },
        { title: "Video Tutorials", desc: "Quick walkthroughs of key features.", icon: HelpCircle },
        { title: "Community Forum", desc: "Discuss with other Habraac users.", icon: MessageSquare }
    ];

    return (
        <div className="max-w-6xl mx-auto space-y-12 pb-20 animate-in fade-in slide-in-from-bottom-6 duration-700">
            {/* Hero Section */}
            <div className="relative rounded-[3rem] overflow-hidden bg-gray-900 p-12 text-white">
                <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-cyan-500/20 to-transparent" />
                <div className="relative z-10 max-w-2xl">
                    <h1 className="text-4xl font-black mb-4 tracking-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>How can we help?</h1>
                    <p className="text-gray-400 text-lg font-medium mb-8">Search our documentation or reach out to our team for specialized assistance.</p>

                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-cyan-400 transition-colors" size={24} />
                        <input
                            type="text"
                            placeholder="Search help articles..."
                            className="w-full pl-14 pr-6 py-5 bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl text-lg outline-none focus:ring-4 focus:ring-cyan-500/20 focus:border-cyan-500/50 transition-all text-white placeholder-gray-500"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {resources.map((item, i) => (
                    <div key={i} className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-xl shadow-gray-100/30 hover:-translate-y-1 transition-all cursor-pointer group">
                        <div className="w-14 h-14 rounded-2xl bg-cyan-50 flex items-center justify-center text-cyan-600 mb-6 group-hover:scale-110 transition-transform">
                            <item.icon size={28} />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">{item.title}</h3>
                        <p className="text-gray-500 font-medium text-sm mb-4">{item.desc}</p>
                        <div className="flex items-center text-cyan-600 font-bold text-xs uppercase tracking-widest gap-2">
                            Access Now <ChevronRight size={14} />
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                {/* FAQs */}
                <div className="lg:col-span-2 space-y-6">
                    <h2 className="text-2xl font-black text-gray-900 flex items-center gap-3">
                        <HelpCircle size={28} className="text-cyan-500" />
                        Frequently Asked Questions
                    </h2>
                    <div className="space-y-4">
                        {faqs.map((faq, i) => (
                            <div key={i} className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-all">
                                <h4 className="font-bold text-gray-900 mb-2 flex justify-between items-center group cursor-pointer">
                                    {faq.q}
                                    <ChevronRight size={18} className="text-gray-300 group-hover:text-cyan-500 transition-colors" />
                                </h4>
                                <p className="text-gray-500 text-sm font-medium leading-relaxed">{faq.a}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Contact Support */}
                <div className="space-y-6">
                    <h2 className="text-2xl font-black text-gray-900 flex items-center gap-3">
                        <Mail size={28} className="text-cyan-500" />
                        Get in Touch
                    </h2>
                    <div className="bg-gray-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl">
                        <div className="absolute top-0 right-0 p-8 opacity-10">
                            <Ticket size={120} />
                        </div>
                        <div className="space-y-6 relative z-10">
                            <div>
                                <h3 className="text-xl font-bold mb-2">Technical Support</h3>
                                <p className="text-gray-400 text-sm mb-4">Fast response for all your system related issues.</p>
                                <button className="w-full py-3 bg-cyan-500 text-white rounded-xl font-bold hover:bg-cyan-400 transition-colors shadow-lg shadow-cyan-500/20">
                                    Open Support Ticket
                                </button>
                            </div>

                            <hr className="border-white/10" />

                            <div className="space-y-4">
                                <div className="flex items-center gap-4 text-sm text-gray-400">
                                    <Phone size={18} className="text-cyan-500" />
                                    <span>0633825207</span>
                                </div>
                                <div className="flex items-center gap-4 text-sm text-gray-400">
                                    <Mail size={18} className="text-cyan-500" />
                                    <span>support@habraac.com</span>
                                </div>
                                <div className="flex items-center gap-4 text-sm text-gray-400">
                                    <Clock size={18} className="text-cyan-500" />
                                    <span>Mon-Fri: 9AM - 6PM</span>
                                </div>
                            </div>

                            <div className="pt-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-cyan-500">
                                <CheckCircle2 size={12} />
                                Server Status: Healthy
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Support;
