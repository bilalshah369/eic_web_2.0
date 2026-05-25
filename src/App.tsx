import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuth } from './hooks/useAuth';
import { UserRole } from './types';
import Home from './pages/Home';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import OfficePortal from './pages/OfficePortal';
import OfficerPortal from './pages/OfficerPortal';
import DbSchemaPage from './pages/DbSchemaPage';

const queryClient = new QueryClient();

export function roleHome(role: UserRole | undefined): string {
  if (!role) return '/';
  if (role === 'ADMIN' || role === 'SUPER_ADMIN') return '/admin/home';
  if (role === 'EIA_ADMIN' || role === 'SUB_EIA_ADMIN') return '/office-portal';
  if (role === 'OFFICER') return '/officer-portal';
  return '/dashboard';
}

const RoleRoute = ({ roles, children }: { roles: UserRole[]; children: React.ReactNode }) => {
  const { isAuthenticated, loading, user } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!isAuthenticated) return <Navigate to="/" replace />;
  if (!user || !roles.includes(user.role)) return <Navigate to={roleHome(user?.role)} replace />;
  return <>{children}</>;
};

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={
            <RoleRoute roles={['USER']}>
              <Dashboard />
            </RoleRoute>
          } />
          <Route path="/dashboard/:section" element={
            <RoleRoute roles={['USER']}>
              <Dashboard />
            </RoleRoute>
          } />
          <Route path="/admin" element={<Navigate to="/admin/home" replace />} />
          <Route path="/admin/:section" element={
            <RoleRoute roles={['ADMIN', 'SUPER_ADMIN']}>
              <AdminDashboard />
            </RoleRoute>
          } />
          <Route path="/office-portal" element={<Navigate to="/office-portal/dashboard" replace />} />
          <Route path="/office-portal/:section" element={
            <RoleRoute roles={['EIA_ADMIN', 'SUB_EIA_ADMIN']}>
              <OfficePortal />
            </RoleRoute>
          } />
          <Route path="/officer-portal" element={
            <RoleRoute roles={['OFFICER']}>
              <OfficerPortal />
            </RoleRoute>
          } />
          <Route path="/db-schema" element={<DbSchemaPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
