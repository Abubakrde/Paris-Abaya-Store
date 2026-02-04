import React, { useState } from 'react';
import { LayoutDashboard, ShoppingBag, PieChart, Package, MessageSquare, Ticket, FileText, ChevronLeft, ChevronRight, Users, Settings, Folder, Zap } from 'lucide-react';

const Sidebar = ({ activeItem, onItemClick, userRole }) => {
    const [isCollapsed, setIsCollapsed] = useState(false);

    const menuItems = [
        { icon: ShoppingBag, label: 'Sales', active: false },
        { icon: Users, label: 'Customers', active: false },
        { icon: Package, label: 'Inventory', active: false },
        { icon: LayoutDashboard, label: 'Reports', active: false },
        { icon: PieChart, label: 'Analytics', active: false },
        { icon: FileText, label: 'Bills', active: false },
        { icon: Zap, label: 'Utilities', active: false },
        { icon: MessageSquare, label: 'Messages', active: false },
        { icon: Ticket, label: 'Support', active: false },
    ];

    if (userRole === 'admin') {
        menuItems.splice(4, 0, { icon: Users, label: 'Users', active: false });
        menuItems.splice(4, 0, { icon: Folder, label: 'Categories', active: false });
    }

    return (
        <aside
            className={`h-full bg-white border-r border-gray-100 flex flex-col transition-all duration-300 relative ${isCollapsed ? 'w-24' : 'w-80'}`}
            style={{
                boxShadow: '4px 0 24px rgba(0,0,0,0.02)',
                zIndex: 20
            }}
        >

            {/* Toggle Button */}
            <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="absolute -right-3 top-10 bg-white border border-gray-100 rounded-full p-2 shadow-md hover:shadow-lg hover:bg-gray-50 z-50 text-gray-400 hover:text-red-700 transition-all"
            >
                {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </button>

            {/* Logo Area */}
            <div className={`p-8 mb-4 flex items-center gap-4 transition-all ${isCollapsed ? 'justify-center' : ''}`}>
                <div className="w-12 h-12 bg-gradient-to-br from-red-600 to-red-900 rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-red-900/20"
                    style={{ background: 'linear-gradient(135deg, #991b1b 0%, #7f1d1d 100%)' }}>
                    <div className="w-6 h-6 border-[3px] border-[#d4af37] rounded-lg" />
                </div>
                {!isCollapsed && (
                    <div className="flex flex-col">
                        <span className="font-bold text-xl text-gray-900 tracking-tight leading-none" style={{ fontFamily: 'Outfit, sans-serif' }}>PARIS ABAYA</span>
                        <span className="text-[10px] text-red-800 font-black tracking-[0.2em] uppercase mt-1">Premium Collection</span>
                    </div>
                )}
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-6 space-y-2 overflow-y-auto custom-scrollbar">
                {menuItems.map((item) => {
                    const isActive = activeItem === item.label;
                    return (
                        <button
                            key={item.label}
                            onClick={() => onItemClick(item.label)}
                            className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all group relative overflow-hidden
                                ${isActive
                                    ? 'text-cyan-700 font-bold'
                                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50 hover:shadow-sm hover:translate-x-1'
                                }`}
                            style={isActive ? { backgroundColor: 'rgba(6, 182, 212, 0.1)', color: 'var(--color-primary)' } : {}}
                        >
                            {/* Active Indicator Bar */}
                            {isActive && (
                                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-10 bg-red-700 rounded-r-full" />
                            )}

                            <item.icon
                                size={24}
                                className={`transition-colors shrink-0 ${isActive ? 'text-red-700' : 'text-gray-400 group-hover:text-gray-600'}`}
                                strokeWidth={isActive ? 2.5 : 2}
                            />

                            {!isCollapsed && (
                                <span className="text-[17px] tracking-wide">{item.label}</span>
                            )}

                            {/* Tooltip for collapsed state */}
                            {isCollapsed && (
                                <div className="absolute left-full ml-4 px-3 py-2 bg-gray-900 text-white text-sm font-medium rounded-xl opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 shadow-xl translate-x-2 group-hover:translate-x-0 transition-all">
                                    {item.label}
                                </div>
                            )}
                        </button>
                    );
                })}
            </nav>

            {/* Bottom Actions */}
            <div className="p-6 border-t border-gray-100/50 mt-auto">
                <button
                    onClick={() => onItemClick('Settings')}
                    className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all group relative
                        ${activeItem === 'Settings'
                            ? 'bg-gray-100 text-gray-900 font-bold'
                            : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900 hover:shadow-sm'
                        }`}
                >
                    <Settings
                        size={24}
                        className={`transition-colors shrink-0 ${activeItem === 'Settings' ? 'text-gray-900' : 'text-gray-400 group-hover:text-gray-600'}`}
                        strokeWidth={activeItem === 'Settings' ? 2.5 : 2}
                    />
                    {!isCollapsed && <span className="text-[17px] tracking-wide">Settings</span>}

                    {isCollapsed && (
                        <div className="absolute left-full ml-4 px-3 py-2 bg-gray-900 text-white text-sm font-medium rounded-xl opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 shadow-xl">
                            Settings
                        </div>
                    )}
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
