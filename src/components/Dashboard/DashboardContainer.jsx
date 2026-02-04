import React from 'react';
import Sidebar from '../Layout/Sidebar';
import Header from '../Layout/Header';
import StatsCards from './StatsCards';
import Tabs from './Tabs';
import ProductTable from './ProductTable';
import Settings from './Settings';
import UserManagement from './UserManagement';
import SalesDashboard from './SalesDashboard';
import CategoryManager from '../Admin/CategoryManager';
import AnalyticsDashboard from './AnalyticsDashboard';
import BillsManager from './BillsManager';
import UtilityManager from './UtilityManager';
import Messages from './Messages';
import CustomerManager from './CustomerManager';
import Support from './Support';
import AddProductModal from './AddProductModal';
import { Plus } from 'lucide-react';

const DashboardContainer = ({
    session,
    userProfile,
    activeMenuItem,
    onMenuItemClick,
    activeTab,
    onTabChange,
    searchQuery,
    onSearchChange,
    refreshTrigger,
    onProductAdded,
    isModalOpen,
    setIsModalOpen,
    productToEdit,
    setProductToEdit,
    onEditProduct,
    onCloseModal,
    onGoToStore // New: Callback to switch to Store view
}) => {
    return (
        <div className="flex w-full h-screen bg-gray-50 animate-in fade-in duration-500">
            <Sidebar
                activeItem={activeMenuItem}
                onItemClick={onMenuItemClick}
                userRole={userProfile?.role}
            />

            <div className="flex-1 flex flex-col h-full overflow-hidden">
                <Header
                    searchQuery={searchQuery}
                    onSearchChange={onSearchChange}
                    userProfile={{
                        ...userProfile,
                        email: session.user.email,
                        full_name: userProfile?.full_name || session.user.user_metadata?.full_name || session.user.user_metadata?.name || 'User',
                        avatar_url: userProfile?.avatar_url || session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture,
                        role: userProfile?.role || 'sales'
                    }}
                    onNavigate={onMenuItemClick}
                />

                <main className="flex-1 overflow-auto p-8">
                    {/* Switcher logic moved here */}
                    {activeMenuItem === 'Inventory' ? (
                        <div className="flex flex-col gap-6">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h1 className="text-2xl font-bold mb-1">{activeMenuItem} Dashboard</h1>
                                    <p className="text-gray-500 text-sm">Real-time overview of your inventory and performance.</p>
                                </div>
                                <div className="flex gap-3">
                                    <button
                                        onClick={onGoToStore}
                                        className="px-5 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-all shadow-sm"
                                    >
                                        Visit Storefront
                                    </button>
                                    <button
                                        onClick={() => {
                                            setProductToEdit(null);
                                            setIsModalOpen(true);
                                        }}
                                        className="flex items-center gap-2 text-white px-5 py-2.5 rounded-xl font-semibold shadow-lg shadow-red-900/20 hover:shadow-red-900/40 hover:-translate-y-0.5 transition-all duration-200"
                                        style={{ background: 'linear-gradient(135deg, #991b1b 0%, #7f1d1d 100%)' }}
                                    >
                                        <Plus size={20} strokeWidth={2.5} />
                                        Add Product
                                    </button>
                                </div>
                            </div>

                            <StatsCards />

                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6" style={{ background: 'transparent', border: 'none', padding: 0, boxShadow: 'none' }}>
                                <Tabs activeTab={activeTab} onTabChange={onTabChange} />
                                <ProductTable
                                    activeTab={activeTab}
                                    refreshTrigger={refreshTrigger}
                                    searchQuery={searchQuery}
                                    onEdit={onEditProduct}
                                    userRole={userProfile?.role}
                                />
                            </div>
                        </div>
                    ) : activeMenuItem === 'Settings' ? (
                        <Settings session={session} />
                    ) : activeMenuItem === 'Users' && userProfile?.role === 'admin' ? (
                        <UserManagement />
                    ) : activeMenuItem === 'Categories' && userProfile?.role === 'admin' ? (
                        <CategoryManager />
                    ) : activeMenuItem === 'Sales' ? (
                        <SalesDashboard session={session} userRole={userProfile?.role} />
                    ) : activeMenuItem === 'Customers' ? (
                        <CustomerManager />
                    ) : activeMenuItem === 'Analytics' || activeMenuItem === 'Reports' ? (
                        <AnalyticsDashboard />
                    ) : activeMenuItem === 'Bills' ? (
                        <BillsManager session={session} />
                    ) : activeMenuItem === 'Utilities' ? (
                        <UtilityManager />
                    ) : activeMenuItem === 'Messages' ? (
                        <Messages session={session} />
                    ) : activeMenuItem === 'Support' ? (
                        <Support />
                    ) : (
                        <div className="flex items-center justify-center h-full text-gray-500 text-center">
                            <div>
                                <h2 className="text-xl font-semibold mb-2">{activeMenuItem}</h2>
                                <p>This module is currently under development.</p>
                            </div>
                        </div>
                    )}
                </main>
            </div>

            <AddProductModal
                isOpen={isModalOpen}
                onClose={onCloseModal}
                onProductAdded={onProductAdded}
                productToEdit={productToEdit}
            />
        </div>
    );
};

export default DashboardContainer;
