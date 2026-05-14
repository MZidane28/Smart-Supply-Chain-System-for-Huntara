import { useState } from 'react';
import { Outlet } from 'react-router';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export function Layout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar mobileOpen={mobileMenuOpen} onNavigate={() => setMobileMenuOpen(false)} />
      {mobileMenuOpen && (
        <button
          aria-label="Tutup menu"
          className="fixed inset-0 bg-black/30 z-20 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
      <Header onMenuClick={() => setMobileMenuOpen(true)} />
      <main className="pt-16 lg:ml-64">
        <Outlet />
      </main>
    </div>
  );
}
