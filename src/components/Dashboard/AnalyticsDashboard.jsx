import React, { useState, useEffect } from 'react';
import {
    LineChart, Line, AreaChart, Area, BarChart, Bar,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from 'recharts';
import {
    TrendingUp, TrendingDown, DollarSign, Package,
    Users, ArrowUpRight, ArrowDownRight, Download, Filter, CheckCircle2
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import Papa from 'papaparse';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const AnalyticsDashboard = () => {
    const [salesData, setSalesData] = useState([]);
    const [categoryData, setCategoryData] = useState([]);
    const [paymentData, setPaymentData] = useState([]);
    const [topProducts, setTopProducts] = useState([]);
    const [lowStockProducts, setLowStockProducts] = useState([]);
    const [customerDebtData, setCustomerDebtData] = useState([]);
    const [stats, setStats] = useState({
        totalRevenue: 0,
        totalExpenses: 0,
        netProfit: 0,
        avgOrderValue: 0,
        salesCount: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async () => {
        try {
            setLoading(true);

            // 1. Fetch Sales
            const { data: sales, error: salesError } = await supabase
                .from('sales')
                .select(`
                    id,
                    total_price,
                    quantity,
                    sale_date,
                    payment_method,
                    customer_name,
                    status,
                    products (name, category)
                `)
                .order('sale_date', { ascending: true });

            if (salesError) throw salesError;

            // 2. Fetch Utilities (Expenses)
            const { data: utilities, error: utilError } = await supabase
                .from('utilities')
                .select('*');

            if (utilError) throw utilError;

            // Ensure we have arrays even if data is null
            const safeSales = sales || [];
            const safeUtilities = utilities || [];

            // 3. Process Daily Sales
            const dailyMap = safeSales.reduce((acc, sale) => {
                if (!sale.sale_date) return acc;
                try {
                    const dateObj = new Date(sale.sale_date);
                    if (isNaN(dateObj.getTime())) return acc;
                    const date = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                    acc[date] = (acc[date] || 0) + (sale.total_price || 0);
                } catch (e) {
                    console.error('Error processing date:', e);
                }
                return acc;
            }, {});

            const processedSales = Object.keys(dailyMap).map(date => ({
                name: date,
                revenue: dailyMap[date]
            }));

            // 4. Process Category Breakdown
            const categoryMap = safeSales.reduce((acc, sale) => {
                const cat = sale.products?.category || 'Uncategorized';
                acc[cat] = (acc[cat] || 0) + (sale.total_price || 0);
                return acc;
            }, {});

            const processedCategories = Object.keys(categoryMap).map(cat => ({
                name: cat,
                value: categoryMap[cat]
            }));

            // 4.5 Process Payment Methods
            const paymentMap = safeSales.reduce((acc, sale) => {
                const method = (sale.payment_method || 'CASH').toUpperCase();
                acc[method] = (acc[method] || 0) + (sale.total_price || 0);
                return acc;
            }, {});

            const processedPayments = Object.keys(paymentMap).map(method => ({
                name: method,
                value: paymentMap[method]
            }));

            // 4.7 Process Customer Debt/Payments
            const customerDebtMap = safeSales.reduce((acc, sale) => {
                const customer = sale.customer_name || 'Walk-in Customer';
                if (!acc[customer]) acc[customer] = { paid: 0, unpaid: 0 };

                const amount = sale.total_price || 0;
                if (sale.status === 'Paid') {
                    acc[customer].paid += amount;
                } else {
                    acc[customer].unpaid += amount;
                }
                return acc;
            }, {});

            const processedCustomerDebt = Object.keys(customerDebtMap)
                .map(name => ({
                    name,
                    paid: customerDebtMap[name].paid,
                    unpaid: customerDebtMap[name].unpaid,
                    total: customerDebtMap[name].paid + customerDebtMap[name].unpaid
                }))
                .sort((a, b) => b.total - a.total)
                .slice(0, 8);

            // 5. Top Selling Products
            const productMap = safeSales.reduce((acc, sale) => {
                const name = sale.products?.name || 'Unknown';
                acc[name] = (acc[name] || 0) + (sale.quantity || 0);
                return acc;
            }, {});

            const processedProducts = Object.keys(productMap)
                .map(name => ({ name, sales: productMap[name] }))
                .sort((a, b) => b.sales - a.sales)
                .slice(0, 5);

            // 6. Fetch Low Stock Products for Prediction
            const { data: lowStock, error: lowStockError } = await supabase
                .from('products')
                .select('name, stock, capacity')
                .lt('stock', 20)
                .order('stock', { ascending: true })
                .slice(0, 4);

            if (lowStockError) throw lowStockError;

            // 7. Calculate Financials
            const totalRevenue = safeSales.reduce((sum, s) => sum + (s.total_price || 0), 0);
            const totalExpenses = safeUtilities.reduce((sum, u) => sum + parseFloat(u.amount || 0), 0);
            const avgOrder = safeSales.length > 0 ? totalRevenue / safeSales.length : 0;

            setSalesData(processedSales);
            setCategoryData(processedCategories);
            setPaymentData(processedPayments);
            setCustomerDebtData(processedCustomerDebt);
            setTopProducts(processedProducts);
            setLowStockProducts(lowStock || []);
            setStats({
                totalRevenue,
                totalExpenses,
                netProfit: totalRevenue - totalExpenses,
                avgOrderValue: avgOrder,
                salesCount: safeSales.length
            });

        } catch (error) {
            console.error('Error fetching analytics:', error);
        } finally {
            setLoading(false);
        }
    };

    const COLORS = ['#991b1b', '#d4af37', '#7f1d1d', '#b45309', '#450a0a'];
    const PAYMENT_COLORS = {
        'CASH': '#991b1b',
        'DOLLAR': '#d4af37',
        'ZAAD-USD': '#dc2626',
        'ZAAD-SHL': '#991b1b',
        'EDAHAB-USD': '#fbbf24',
        'EDAHAB-SHL': '#d97706'
    };

    const handleQuickRestock = async (product) => {
        const restockAmount = Math.max(20, (product.capacity || 100) - product.stock);
        const newStock = product.stock + restockAmount;
        const newStatus = 'In Stock';

        try {
            const { error } = await supabase
                .from('products')
                .update({
                    stock: newStock,
                    status: newStatus
                })
                .eq('name', product.name); // Using name since lowStock fetch gets name

            if (error) throw error;
            fetchAnalytics();
        } catch (error) {
            alert('Error restocking: ' + error.message);
        }
    };

    const exportCSV = () => {
        const csv = Papa.unparse(salesData);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'revenue_report.csv';
        link.click();
    };

    const exportPDF = () => {
        const doc = new jsPDF();
        doc.text("Business Intelligence Report", 20, 10);
        doc.autoTable({
            head: [['Date', 'Revenue']],
            body: salesData.map(d => [d.name, `$${d.revenue.toFixed(2)}`]),
        });
        doc.save('habraac_analytics.pdf');
    };

    if (loading) return <div className="p-8 text-center text-red-800 animate-pulse font-bold">Generating Intelligence Reports...</div>;

    return (
        <div className="flex flex-col gap-8 pb-12 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>Intelligence Center</h1>
                    <p className="text-gray-500 font-medium">Advanced reporting and sales performance analytics.</p>
                </div>
                <div className="flex gap-3">
                    <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 transition-all shadow-sm">
                        <Download size={18} /> CSV
                    </button>
                    <button onClick={exportPDF} className="flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-bold hover:bg-gray-800 transition-all shadow-lg shadow-gray-900/20">
                        <Filter size={18} /> Full Report (PDF)
                    </button>
                </div>
            </div>

            {/* Top Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-xl shadow-gray-100/40 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                        <DollarSign size={80} />
                    </div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Revenue</p>
                    <h3 className="text-2xl font-black text-gray-900">${stats.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
                    <div className="flex items-center gap-1 mt-2 text-green-500 font-bold text-xs">
                        <ArrowUpRight size={14} />
                        <span>Gross Earnings</span>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-xl shadow-gray-100/40 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform text-rose-500">
                        <TrendingDown size={80} />
                    </div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Expenses</p>
                    <h3 className="text-2xl font-black text-rose-600">${stats.totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
                    <p className="text-xs text-gray-400 mt-2 font-medium">Utilities & Overhead</p>
                </div>

                <div className="bg-gradient-to-br from-red-800 to-red-950 p-6 rounded-[2rem] shadow-xl shadow-red-900/20 text-white relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-15 group-hover:scale-110 transition-transform">
                        <TrendingUp size={80} />
                    </div>
                    <p className="text-[10px] font-black text-white/60 uppercase tracking-widest mb-1">Net Profit</p>
                    <h3 className="text-2xl font-black">${stats.netProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
                    <div className="flex items-center gap-1 mt-2 text-red-200 font-bold text-xs">
                        <CheckCircle2 size={14} />
                        <span>Take Home Pay</span>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-xl shadow-gray-100/40">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Efficiency Ratio</p>
                    <h3 className="text-2xl font-black text-gray-900">
                        {stats.totalRevenue > 0 ? ((stats.netProfit / stats.totalRevenue) * 100).toFixed(1) : 0}%
                    </h3>
                    <div className="flex items-center gap-1 mt-2 text-indigo-500 font-bold text-xs">
                        <Package size={14} />
                        <span>Margin</span>
                    </div>
                </div>
            </div>

            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-xl shadow-gray-100/30">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">Revenue Stream</h3>
                            <p className="text-xs text-gray-400 font-medium">Financial growth visualization</p>
                        </div>
                        <select className="bg-gray-50 border-none text-xs font-bold rounded-lg px-3 py-2 text-gray-500 outline-none">
                            <option>Last 30 Days</option>
                            <option>Last 7 Days</option>
                        </select>
                    </div>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={salesData}>
                                <defs>
                                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#991b1b" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#991b1b" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                                    formatter={(value) => [`$${value}`, 'Revenue']}
                                />
                                <Area type="monotone" dataKey="revenue" stroke="#991b1b" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-xl shadow-gray-100/30 flex flex-col">
                    <h3 className="text-lg font-bold text-gray-900 mb-1">Collection by Method</h3>
                    <p className="text-xs text-gray-400 font-medium mb-8">Revenue source breakdown</p>
                    <div className="h-[250px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={paymentData}
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {paymentData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={PAYMENT_COLORS[entry.name] || COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                                <Legend verticalAlign="bottom" height={36} iconType="circle" />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="mt-4 space-y-2">
                        {paymentData.slice(0, 3).map((item, i) => (
                            <div key={i} className="flex justify-between items-center text-xs">
                                <span className="font-bold text-gray-500">{item.name}</span>
                                <span className="font-black text-gray-900">${item.value.toLocaleString()}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Charts Row 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-xl shadow-gray-100/30">
                    <h3 className="text-lg font-bold text-gray-900 mb-1">Customer Financial Status</h3>
                    <p className="text-xs text-gray-400 font-medium mb-8">Top customers by total volume (Paid vs Unpaid)</p>
                    <div className="space-y-4">
                        <div className="grid grid-cols-4 px-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                            <span className="col-span-1">Customer</span>
                            <span className="text-right">Paid</span>
                            <span className="text-right">Unpaid</span>
                            <span className="text-right">Total</span>
                        </div>
                        {customerDebtData.length === 0 ? (
                            <p className="text-center py-8 text-gray-400 text-sm">No customer data available.</p>
                        ) : (
                            customerDebtData.map((cust, i) => (
                                <div key={i} className="grid grid-cols-4 items-center gap-4 p-4 bg-gray-50 rounded-2xl hover:bg-red-50/30 transition-colors group">
                                    <span className="text-sm font-bold text-gray-900 truncate col-span-1">{cust.name}</span>
                                    <span className="text-right text-sm font-bold text-emerald-600">${cust.paid.toLocaleString()}</span>
                                    <span className="text-right text-sm font-bold text-rose-600">${cust.unpaid.toLocaleString()}</span>
                                    <span className="text-right text-sm font-black text-gray-900 transition-transform group-hover:scale-110">${cust.total.toLocaleString()}</span>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-8">
                    <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-xl shadow-gray-100/30">
                        <h3 className="text-lg font-bold text-gray-900 mb-1">Best Performing Items</h3>
                        <p className="text-xs text-gray-400 font-medium mb-8">Top 5 by unit sales</p>
                        <div className="h-[200px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={topProducts} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                                    <XAxis type="number" hide />
                                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 11, fontWeight: 600 }} width={100} />
                                    <Tooltip />
                                    <Bar dataKey="sales" fill="#991b1b" radius={[0, 10, 10, 0]} barSize={20} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-xl shadow-gray-100/30 relative overflow-hidden">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center text-red-800">
                                <TrendingUp size={24} />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Restock Prediction</h3>
                                <p className="text-xs text-gray-400 font-medium">AI-powered inventory forecasting</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {lowStockProducts.length === 0 ? (
                                <div className="p-8 text-center bg-gray-50 rounded-2xl">
                                    <CheckCircle2 className="mx-auto text-emerald-500 mb-2" size={32} />
                                    <p className="text-sm font-bold text-gray-900">Inventory Healthy</p>
                                    <p className="text-xs text-gray-500">No immediate restocks needed.</p>
                                </div>
                            ) : (
                                lowStockProducts.slice(0, 3).map((product, i) => (
                                    <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-white border border-gray-100 flex items-center justify-center text-[10px] font-bold">#0{i + 1}</div>
                                            <div>
                                                <p className="text-sm font-bold text-gray-900 truncate max-w-[120px]">{product.name}</p>
                                                <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Stock: {product.stock} units</p>
                                            </div>
                                        </div>
                                        <div className="text-right flex flex-col items-end gap-1">
                                            <button
                                                onClick={() => handleQuickRestock(product)}
                                                className="px-3 py-1 bg-red-800 text-white rounded-lg text-[10px] font-black uppercase tracking-tighter hover:bg-red-900 transition-all shadow-md shadow-red-900/20 active:scale-95"
                                            >
                                                Order +{Math.max(20, (product.capacity || 100) - product.stock)} units
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AnalyticsDashboard;
