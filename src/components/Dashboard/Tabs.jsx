import React from 'react';

const Tabs = ({ activeTab, onTabChange }) => {
    const tabs = ['All Products', 'In Stock', 'Low Stock', 'Out of Stock'];

    return (
        <div className="flex gap-8 border-b mb-6" style={{ borderColor: 'var(--color-border)' }}>
            {tabs.map(tab => (
                <button
                    key={tab}
                    onClick={() => onTabChange(tab)}
                    style={{
                        paddingBottom: 16,
                        fontWeight: activeTab === tab ? 600 : 500,
                        color: activeTab === tab ? 'var(--color-text-main)' : 'var(--color-text-secondary)',
                        borderBottom: activeTab === tab ? '2px solid var(--color-primary)' : '2px solid transparent',
                        marginBottom: -1,
                        transition: 'all 0.2s'
                    }}
                >
                    {tab}
                </button>
            ))}
        </div>
    );
};

export default Tabs;
