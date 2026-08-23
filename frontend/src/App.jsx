import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Sidebar from './components/layout/Sidebar';
import { useKeyboardNavigation } from './utils/useKeyboardNavigation';

// Pages
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import BillingPage from './pages/BillingPage';
import SalesHistoryPage from './pages/SalesHistoryPage';
import CustomerDuesPage from './pages/CustomerDuesPage';
import CustomerListPage from './pages/CustomerListPage';
import CustomerDetailPage from './pages/CustomerDetailPage';
import ShopPurchasePage from './pages/ShopPurchasePage';
import HomePurchasePage from './pages/HomePurchasePage';
import SupplierDuesPage from './pages/SupplierDuesPage';
import SupplierListPage from './pages/SupplierListPage';
import InventoryPage from './pages/InventoryPage';
import ReportsPage from './pages/ReportsPage';
import SearchPage from './pages/SearchPage';
import SettingsPage from './pages/SettingsPage';

const ProtectedLayout = () => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-900 text-white font-heading font-bold text-lg">
        Starting Pooja Coconuts ERP...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-900">
      <Sidebar />
      <div className="flex-1 overflow-y-auto">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/sales/new" element={<BillingPage />} />
          <Route path="/sales" element={<SalesHistoryPage />} />
          <Route path="/customers/dues" element={<CustomerDuesPage />} />
          <Route path="/customers" element={<CustomerListPage />} />
          <Route path="/customers/:id" element={<CustomerDetailPage />} />
          <Route path="/purchases/shop" element={<ShopPurchasePage />} />
          <Route path="/purchases/home" element={<HomePurchasePage />} />
          <Route path="/suppliers/dues" element={<SupplierDuesPage />} />
          <Route path="/suppliers" element={<SupplierListPage />} />
          <Route path="/inventory" element={<InventoryPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </div>
  );
};

const App = () => {
  useKeyboardNavigation();

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/*" element={<ProtectedLayout />} />
    </Routes>
  );
};

export default App;
