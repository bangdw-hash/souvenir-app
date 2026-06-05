import { Link, useLocation, useParams } from 'react-router-dom';
import { Home, Calendar, Plus, Settings, Pill } from 'lucide-react';

const navItems = [
  { to: '', icon: Home, label: '홈' },
  { to: '/calendar', icon: Calendar, label: '캘린더' },
  { to: '/add', icon: Plus, label: '추가', highlight: true },
  { to: '/medications', icon: Pill, label: '복약' },
  { to: '/settings', icon: Settings, label: '설정' },
];

export default function Navbar({ group }) {
  const { slug } = useParams();
  const location = useLocation();
  const base = `/group/${slug}`;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 safe-area-pb">
      <div className="flex items-center justify-around max-w-lg mx-auto px-2">
        {navItems.map(({ to, icon: Icon, label, highlight }) => {
          const href = `${base}${to}`;
          const isActive = location.pathname === href;
          return (
            <Link
              key={to}
              to={href}
              className={`flex flex-col items-center gap-0.5 py-2 px-3 min-w-[52px] transition-colors
                ${highlight
                  ? 'relative'
                  : isActive
                    ? 'text-blue-600'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
            >
              {highlight ? (
                <span className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-500 shadow-md -mt-4">
                  <Icon size={20} className="text-white" />
                </span>
              ) : (
                <Icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
              )}
              <span className={`text-[10px] font-medium ${highlight ? 'text-blue-500' : ''}`}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
