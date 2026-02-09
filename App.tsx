import React, { useState } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Splash from './screens/Splash';
import Login from './screens/Login';
import AdminLogin from './screens/AdminLogin';
import ForgotPassword from './screens/ForgotPassword';
import ResetPassword from './screens/ResetPassword';
import Register from './screens/Register';
import Home from './screens/Home';
import Benefits from './screens/Benefits';
import PartnerDetail from './screens/PartnerDetail';
import Social from './screens/Social';
import Profile from './screens/Profile';
import PersonalData from './screens/PersonalData';
import MyCoupons from './screens/MyCoupons';
import Admin from './screens/Admin';
import Protection from './screens/VehicleProtection';
import SalesConsultancy from './screens/SalesConsultancy';
import CorporateConsultancy from './screens/CorporateConsultancy';

import About from './screens/About';
import RegisterPartner from './screens/RegisterPartner';
import PartnerDashboard from './screens/PartnerDashboard';
import { StorePage, ProductDetail, Checkout, MyOrders } from './screens/store';
import { UserRole } from './types';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { CMSProvider } from './contexts/CMSContext';
import { ToastProvider } from './contexts/ToastContext';
import ErrorBoundary from './components/ErrorBoundary';

// Separate component for Routes to use the hook
const AppRoutes: React.FC = () => {
  const { session, role, loading } = useAuth();
  const [showSplash, setShowSplash] = useState(true);

  if (loading) {
    return <div className="min-h-screen bg-black flex items-center justify-center text-gold-500">Carregando...</div>;
  }

  if (showSplash) {
    return <Splash onFinish={() => setShowSplash(false)} />;
  }

  const isAuthenticated = !!session;

  return (
    <Layout>
      <Routes>
        {/* Public Routes */}
        <Route
          path="/login"
          element={!isAuthenticated ? <Login /> : <Navigate to={role === UserRole.PARTNER ? "/partner-dashboard" : role === UserRole.ADMIN ? "/admin" : "/home"} />}
        />
        <Route
          path="/admin-login"
          element={!isAuthenticated ? <AdminLogin /> : <Navigate to={role === UserRole.ADMIN ? "/admin" : "/home"} />}
        />
        {/* Secret admin login route */}
        <Route
          path="/tc-portal-2024"
          element={!isAuthenticated ? <AdminLogin /> : <Navigate to={role === UserRole.ADMIN ? "/admin" : "/home"} />}
        />
        <Route
          path="/forgot-password"
          element={!isAuthenticated ? <ForgotPassword /> : <Navigate to="/home" />}
        />
        {/* Helper redirect for old admin route */}
        <Route
          path="/admin-forgot-password"
          element={<Navigate to="/forgot-password" replace />}
        />
        <Route
          path="/reset-password"
          element={!isAuthenticated ? <ResetPassword /> : <Navigate to="/home" />}
        />
        <Route
          path="/register-partner"
          element={!isAuthenticated ? <RegisterPartner /> : <Navigate to={role === UserRole.PARTNER ? "/partner-dashboard" : "/home"} />}
        />
        <Route
          path="/register"
          element={!isAuthenticated ? <Register /> : <Navigate to="/home" />}
        />

        {/* Protected Routes */}
        <Route
          path="/home"
          element={isAuthenticated ? <Home /> : <Navigate to="/login" />}
        />
        <Route
          path="/benefits"
          element={isAuthenticated ? <Benefits /> : <Navigate to="/login" />}
        />
        <Route
          path="/benefits/:id"
          element={isAuthenticated ? <PartnerDetail /> : <Navigate to="/login" />}
        />
        <Route
          path="/social"
          element={isAuthenticated ? <Social /> : <Navigate to="/login" />}
        />
        <Route
          path="/profile"
          element={isAuthenticated ? <Profile userRole={role} /> : <Navigate to="/login" />}
        />

        {/* New Service Routes */}
        <Route
          path="/protection"
          element={isAuthenticated ? <Protection /> : <Navigate to="/login" />}
        />
        <Route
          path="/consultancy"
          element={isAuthenticated ? <CorporateConsultancy /> : <Navigate to="/login" />}
        />
        <Route
          path="/partnership"
          element={isAuthenticated ? <SalesConsultancy /> : <Navigate to="/login" />}
        />

        {/* Institutional Route */}
        <Route
          path="/about"
          element={isAuthenticated ? <About /> : <Navigate to="/login" />}
        />

        {/* Personal Data Route */}
        <Route
          path="/personal-data"
          element={isAuthenticated ? <PersonalData userRole={role} /> : <Navigate to="/login" />}
        />

        {/* My Coupons Route */}
        <Route
          path="/my-coupons"
          element={isAuthenticated ? <MyCoupons /> : <Navigate to="/login" />}
        />

        {/* Store Routes */}
        <Route
          path="/loja"
          element={isAuthenticated ? <StorePage /> : <Navigate to="/login" />}
        />
        <Route
          path="/loja/produto/:id"
          element={isAuthenticated ? <ProductDetail /> : <Navigate to="/login" />}
        />
        <Route
          path="/checkout/:productId"
          element={isAuthenticated ? <Checkout /> : <Navigate to="/login" />}
        />
        <Route
          path="/meus-pedidos"
          element={isAuthenticated ? <MyOrders /> : <Navigate to="/login" />}
        />

        {/* Partner Routes */}
        <Route
          path="/partner-dashboard"
          element={
            isAuthenticated && role === UserRole.PARTNER
              ? <PartnerDashboard />
              : <Navigate to="/home" />
          }
        />

        {/* Admin Route */}
        <Route
          path="/admin"
          element={
            isAuthenticated && role === UserRole.ADMIN
              ? <Admin />
              : <Navigate to="/home" />
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to={isAuthenticated ? "/home" : "/login"} />} />
      </Routes>
    </Layout>
  );
};

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <CMSProvider>
          <ToastProvider>
            <HashRouter>
              <AppRoutes />
            </HashRouter>
          </ToastProvider>
        </CMSProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
};

export default App;
