import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import ChatInterface from './pages/ChatInterface';
import ComparisonMode from './pages/ComparisonMode';

function App() {
  const isAuthenticated = !!localStorage.getItem('token');

  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <div className="min-h-screen flex flex-col font-sans">
        <Navbar />
        <main className="flex-1 overflow-hidden bg-slate-50">
          <Routes>
            <Route path="/" element={isAuthenticated ? <Navigate to="/dashboard" /> : <Navigate to="/auth" />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={isAuthenticated ? <Dashboard /> : <Navigate to="/auth" />} />
            <Route path="/chat" element={isAuthenticated ? <ChatInterface /> : <Navigate to="/auth" />} />
            <Route path="/compare" element={isAuthenticated ? <ComparisonMode /> : <Navigate to="/auth" />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
