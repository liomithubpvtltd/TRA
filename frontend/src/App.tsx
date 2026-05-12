import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import AnimatedBackground from './components/AnimatedBackground';
import Dashboard from './pages/Dashboard';
import Calculators from './pages/Calculators';
import Settings from './pages/Settings';
import Portfolio from './pages/Portfolio';
import Orders from './pages/Orders';


import Reports from './pages/Reports';


export default function App() {
  return (
    <Router>
      <div style={{ minHeight: '100vh', position: 'relative', display: 'flex' }}>
        <AnimatedBackground />

        {/* Sidebar */}
        <div style={{ position: 'relative', zIndex: 10, flexShrink: 0 }}>
          <Sidebar />
        </div>

        {/* Main Content */}
        <div style={{ flex: 1, overflowY: 'auto', position: 'relative', zIndex: 1, minHeight: '100vh' }}>
          <Routes>
            <Route path="/"            element={<Dashboard />} />
            <Route path="/portfolio"   element={<Portfolio />} />
            <Route path="/orders"      element={<Orders />} />
            <Route path="/reports"     element={<Reports />} />
            <Route path="/calculators" element={<Calculators />} />
            <Route path="/settings"    element={<Settings />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

