import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ShieldCheck, LogOut, MessageSquare, LayoutDashboard, SplitSquareHorizontal } from 'lucide-react';
import clsx from 'clsx';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem('token');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('email');
    navigate('/auth');
  };

  const navLinks = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/chat',      icon: MessageSquare,         label: 'Ask AI'    },
    { to: '/compare',   icon: SplitSquareHorizontal, label: 'Compare'   },
  ];

  return (
    <nav className="bg-white/90 backdrop-blur-md border-b border-slate-100 px-6 py-3 flex justify-between items-center shadow-sm z-50 sticky top-0">
      <Link to="/" className="flex items-center gap-2.5 group">
        <div className="p-1.5 bg-indigo-600 rounded-xl group-hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-200">
          <ShieldCheck className="w-5 h-5 text-white" />
        </div>
        <span className="font-black text-xl gradient-text tracking-tight">VerifAI</span>
      </Link>

      {token && (
        <div className="flex items-center gap-1 text-sm font-medium">
          {navLinks.map(({ to, icon: Icon, label }) => {
            const isActive = location.pathname === to;
            return (
              <Link
                key={to}
                to={to}
                className={clsx(
                  'flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-200',
                  isActive
                    ? 'bg-indigo-50 text-indigo-600 font-semibold shadow-sm shadow-indigo-100'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                )}
              >
                <Icon className={clsx('w-4 h-4 transition-transform duration-200', isActive && 'scale-110')} />
                {label}
                {isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 ml-0.5 animate-pulse" />
                )}
              </Link>
            );
          })}

          <div className="h-6 w-px bg-slate-200 mx-2" />

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-all duration-200 font-medium"
          >
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      )}
    </nav>
  );
}
