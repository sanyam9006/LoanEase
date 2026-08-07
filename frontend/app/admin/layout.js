'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import api from '../../lib/api';

export default function AdminLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [authenticated, setAuthenticated] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (pathname === '/admin/login') {
      setChecking(false);
      return;
    }
    if (!api.isAuthenticated()) {
      router.push('/admin/login');
    } else {
      setAuthenticated(true);
    }
    setChecking(false);
  }, [pathname, router]);

  const handleLogout = () => {
    api.logout();
    router.push('/admin/login');
  };

  // Login page — no sidebar
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  if (checking) {
    return (
      <div className="loading-page">
        <div className="spinner"></div>
        <p style={{ color: 'var(--text-muted)' }}>Loading...</p>
      </div>
    );
  }

  if (!authenticated) return null;

  const navItems = [
    { href: '/admin/dashboard', label: 'Dashboard', icon: '📊' },
    { href: '/admin/leads', label: 'Lead Management', icon: '👥' },
    { href: '/admin/bre', label: 'BRE Rules', icon: '⚙️' },
    { href: '/admin/users', label: 'Admins', icon: '🔑' },
  ];

  return (
    <div className="admin-layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <h2>🏦 LoanEase</h2>
          <p>Admin Panel</p>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`sidebar-link ${pathname === item.href ? 'active' : ''}`}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="sidebar-footer">
          <Link href="/" className="sidebar-link" style={{ marginBottom: '0.5rem' }}>
            <span>🏠</span>
            Loan Application
          </Link>
          <button
            className="sidebar-link"
            onClick={handleLogout}
            style={{
              width: '100%',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'inherit',
              fontSize: 'inherit',
              textAlign: 'left',
              color: 'var(--danger)',
            }}
          >
            <span>🚪</span>
            Logout
          </button>
        </div>
      </aside>

      <main className="admin-content">{children}</main>
    </div>
  );
}
