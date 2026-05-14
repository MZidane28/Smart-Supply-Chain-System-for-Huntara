import { NavLink } from 'react-router';
import { Home, Map, Database, Brain, Building, LogOut, Waves } from 'lucide-react';

const navRoutes = [
  { id: 'beranda',    label: 'Beranda',              icon: Home,     to: '/',           end: true  },
  { id: 'logistik',   label: 'Logistik & Pemetaan',   icon: Map,      to: '/logistik',   end: false },
  { id: 'blockchain', label: 'Inventaris Blockchain', icon: Database, to: '/inventaris', end: false },
  { id: 'ai',         label: 'Optimasi AI',           icon: Brain,    to: '/optimasi',   end: false },
  { id: 'konstruksi', label: 'Konstruksi & BIM',      icon: Building, to: '/konstruksi', end: false },
];

interface SidebarProps {
  mobileOpen: boolean;
  onNavigate: () => void;
}

export function Sidebar({ mobileOpen, onNavigate }: SidebarProps) {
  return (
    <div
      className={`w-64 h-screen bg-white border-r border-gray-200 flex flex-col fixed left-0 top-0 z-30 transform transition-transform duration-200 lg:translate-x-0 ${
        mobileOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      {/* Logo */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center shadow-sm">
            <Waves className="w-6 h-6 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-gray-900">Huntara</span>
            <span className="text-xs text-gray-500">Supply Chain</span>
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 p-4 overflow-y-auto">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 mb-3">Menu Utama</p>
        <ul className="space-y-1">
          {navRoutes.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.id}>
                <NavLink
                  to={item.to}
                  end={item.end}
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    `w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors text-sm font-medium ${
                      isActive
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                      <span>{item.label}</span>
                      {isActive && <div className="ml-auto w-1.5 h-1.5 bg-blue-600 rounded-full" />}
                    </>
                  )}
                </NavLink>
              </li>
            );
          })}

        </ul>
      </nav>

      {/* Bottom */}
      <div className="p-4 border-t border-gray-200">
        <button className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors text-sm font-medium">
          <LogOut className="w-5 h-5" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}
