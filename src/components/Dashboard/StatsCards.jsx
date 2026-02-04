import React, { useEffect, useState } from 'react';
import { ClipboardList, AlertTriangle, Banknote } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

const StatsCard = ({ title, value, change, changeText, icon: Icon, alert, loading }) => {
    return (
        <div style={{
            background: 'white',
            borderRadius: 12,
            padding: 24,
            border: '1px solid var(--color-border)',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            flex: 1
        }}>
            <div className="flex justify-between items-start">
                <span style={{ color: 'var(--color-primary)', fontWeight: 600, fontSize: 14 }}>{title}</span>
                <Icon size={20} style={{ color: 'var(--color-primary)' }} />
            </div>

            <div style={{ fontSize: 32, fontWeight: 700 }}>
                {loading ? (
                    <span className="animate-pulse bg-gray-200 rounded h-8 w-24 block"></span>
                ) : value}
            </div>

            <div style={{ fontSize: 13, display: 'flex', gap: 4 }}>
                <span style={{
                    color: alert ? 'var(--color-danger)' : 'var(--color-success)',
                    fontWeight: 600
                }}>
                    {change}
                </span>
                <span style={{ color: 'var(--color-text-secondary)' }}>{changeText}</span>
            </div>
        </div>
    );
};

const StatsCards = () => {
    const [stats, setStats] = useState({
        totalItems: 0,
        lowStock: 0,
        inventoryValue: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                // Fetch Total Items
                const { count: totalItems, error: error1 } = await supabase
                    .from('products')
                    .select('*', { count: 'exact', head: true });

                // Fetch Low Stock (under 20)
                const { count: lowStock, error: error2 } = await supabase
                    .from('products')
                    .select('*', { count: 'exact', head: true })
                    .lt('stock', 20);

                // Fetch Inventory Value (sum of price * stock)
                const { data: products, error: error3 } = await supabase
                    .from('products')
                    .select('price, stock');

                if (error1 || error2 || error3) throw new Error('Failed to fetch stats');

                const inventoryValue = products.reduce((sum, item) => sum + (Number(item.price) * Number(item.stock)), 0);

                setStats({
                    totalItems: totalItems || 0,
                    lowStock: lowStock || 0,
                    inventoryValue: inventoryValue
                });
            } catch (error) {
                console.error('Error fetching stats:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();

        // Subscribe to changes
        const subscription = supabase
            .channel('stats_changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, fetchStats)
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2
        }).format(value);
    };

    return (
        <div className="flex gap-6 mb-8">
            <StatsCard
                title="Total Items"
                value={stats.totalItems}
                change="+5.4%"
                changeText="from last month"
                icon={ClipboardList}
                loading={loading}
            />
            <StatsCard
                title="Low Stock Alerts"
                value={stats.lowStock}
                change={stats.lowStock > 0 ? "Requires attention" : "All good"}
                changeText={stats.lowStock > 0 ? "items low on stock" : "Inventory healthy"}
                icon={AlertTriangle}
                alert={stats.lowStock > 0}
                loading={loading}
            />
            <StatsCard
                title="Inventory Value"
                value={formatCurrency(stats.inventoryValue)}
                change="+12%"
                changeText="asset valuation"
                icon={Banknote}
                loading={loading}
            />
        </div>
    );
};

export default StatsCards;
