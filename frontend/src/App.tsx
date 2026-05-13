import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import AnimatedBackground from './components/AnimatedBackground';
import Dashboard from './pages/Dashboard';
import Calculators from './pages/Calculators';
import Profile from './pages/Profile';
import Portfolio from './pages/Portfolio';
import Orders from './pages/Orders';
import Reports from './pages/Reports';
import Login from './pages/Login';
import Register from './pages/Register';
import Admin from './pages/Admin';
import { AuthProvider, useAuth } from './context/AuthContext';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <>{children}</> : <Navigate to="/login" />;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user || user.role !== 'admin') return <Navigate to="/" />;
  return <>{children}</>;
}

function LayoutContent() {
  const { user } = useAuth();
  return (
    <div style={{ minHeight: '100vh', position: 'relative', display: 'flex' }}>
      <AnimatedBackground />

      {/* Sidebar - Only show if logged in */}
      {user && (
        <div style={{ position: 'relative', zIndex: 10, flexShrink: 0 }}>
          <Sidebar />
        </div>
      )}

      {/* Main Content */}
      <div style={{ flex: 1, overflowY: 'auto', position: 'relative', zIndex: 1, minHeight: '100vh' }}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/portfolio" element={<PrivateRoute><Portfolio /></PrivateRoute>} />
          <Route path="/orders" element={<PrivateRoute><Orders /></PrivateRoute>} />
          <Route path="/reports" element={<PrivateRoute><Reports /></PrivateRoute>} />
          <Route path="/calculators" element={<PrivateRoute><Calculators /></PrivateRoute>} />
          <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
          <Route path="/admin" element={<AdminRoute><Admin /></AdminRoute>} />
        </Routes>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <LayoutContent />
      </Router>
    </AuthProvider>
  );
}

