import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { CustomerLayout } from './components/CustomerLayout';
import { LoginView } from './pages/LoginView';
import { OnboardingView } from './pages/OnboardingView';
import { MenuView } from './pages/MenuView';
import { CakeCustomizerView } from './pages/CakeCustomizerView';
import { CartView } from './pages/CartView';
import { CheckoutView } from './pages/CheckoutView';
import { ReceiptView } from './pages/ReceiptView';
import { OrdersView } from './pages/OrdersView';
import { ProfileView } from './pages/ProfileView';
import { StaffPortalView } from './pages/StaffPortalView';
import { CustomPlateBuilderView } from './pages/CustomPlateBuilderView';
import { DEFAULT_ADDONS } from './config/menuData';

// Protected Route Guard
const ProtectedRoute: React.FC<{
  children: React.ReactNode;
  allowedRoles?: ('customer' | 'staff' | 'admin')[];
}> = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fbf6ed] dark:bg-[#1f1b19] flex items-center justify-center p-6 text-center">
        <div className="space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-[#f28a4b] text-white flex items-center justify-center text-2xl mx-auto animate-bounce">
            🐾
          </div>
          <p className="text-xs font-bold text-[#6f5c54] dark:text-[#c1b2a9]">
            Waking up, try again in a minute if backend is resuming...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={user.role === 'customer' ? '/' : '/staff'} replace />;
  }

  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginView />} />

      {/* Staff & Admin Route */}
      <Route
        path="/staff"
        element={
          <ProtectedRoute allowedRoles={['staff', 'admin']}>
            <StaffPortalView />
          </ProtectedRoute>
        }
      />

      {/* Customer Routes (Centered Phone Frame) */}
      <Route
        path="/"
        element={
          <ProtectedRoute allowedRoles={['customer', 'staff', 'admin']}>
            <CustomerLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<MenuView />} />
        <Route path="onboarding" element={<OnboardingView />} />
        <Route path="cake" element={<CakeCustomizerView />} />
        <Route path="custom-plate" element={<CustomPlateBuilderView addons={DEFAULT_ADDONS} />} />
        <Route path="cart" element={<CartView />} />
        <Route path="checkout" element={<CheckoutView />} />
        <Route path="receipt/:id" element={<ReceiptView />} />
        <Route path="orders" element={<OrdersView />} />
        <Route path="profile" element={<ProfileView />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
