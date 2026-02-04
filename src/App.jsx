import { useState, useEffect } from 'react'
import { supabase } from './lib/supabaseClient'
import Login from './components/Auth/Login'
import Storefront from './pages/Store/StoreIndex'
import DashboardContainer from './components/Dashboard/DashboardContainer'

function App() {
  const [view, setView] = useState('store'); // 'store' or 'dashboard'
  const [session, setSession] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Dashboard State
  const [activeTab, setActiveTab] = useState('All Products');
  const [activeMenuItem, setActiveMenuItem] = useState('Inventory');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [productToEdit, setProductToEdit] = useState(null);

  useEffect(() => {
    // Check if user should start in dashboard via URL or session
    if (window.location.hash === '#admin') setView('dashboard');

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchUserProfile(session.user.id);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchUserProfile(session.user.id);
      else {
        setUserProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (userId) => {
    try {
      const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
      setUserProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-red-800 border-t-transparent rounded-full animate-spin" />
          <p className="text-red-800 font-black tracking-widest text-xs uppercase">Paris Abaya</p>
        </div>
      </div>
    );
  }

  // --- PUBLIC STOREFRONT VIEW ---
  if (view === 'store') {
    return (
      <>
        <Storefront />
        {/* Floating Admin Access for authorized users / dev */}
        <button
          onClick={() => setView('dashboard')}
          className="fixed bottom-6 right-6 px-4 py-2 bg-black/80 hover:bg-black text-white text-[10px] font-black uppercase tracking-widest rounded-full backdrop-blur-md opacity-30 hover:opacity-100 transition-all z-[1000]"
        >
          Staff Portal
        </button>
      </>
    );
  }

  // --- DASHBOARD LOGIN VIEW ---
  if (!session) {
    return (
      <div className="relative">
        <Login />
        <button
          onClick={() => setView('store')}
          className="absolute top-6 right-6 px-6 py-2 bg-white/10 hover:bg-white/20 text-white text-[10px] font-black uppercase tracking-widest rounded-full backdrop-blur-md border border-white/20 transition-all"
        >
          Return to Store
        </button>
      </div>
    );
  }

  // --- MANAGEMENT DASHBOARD VIEW ---
  return (
    <DashboardContainer
      session={session}
      userProfile={userProfile}
      activeMenuItem={activeMenuItem}
      onMenuItemClick={setActiveMenuItem}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      refreshTrigger={refreshTrigger}
      onProductAdded={() => setRefreshTrigger(prev => prev + 1)}
      isModalOpen={isModalOpen}
      setIsModalOpen={setIsModalOpen}
      productToEdit={productToEdit}
      setProductToEdit={setProductToEdit}
      onEditProduct={(p) => { setProductToEdit(p); setIsModalOpen(true); }}
      onCloseModal={() => { setIsModalOpen(false); setProductToEdit(null); }}
      onGoToStore={() => setView('store')}
    />
  );
}

export default App;
