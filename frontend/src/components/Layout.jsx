import React, { useState, useContext, useEffect } from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import { AuthContext } from '../contexts/AuthContext';
import { COLORS } from '../constants/schoolData';
import { useLocation } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const { logout } = useContext(AuthContext);
  const { user } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();

  const openLogout = () => setLogoutOpen(true);
  const closeLogout = () => setLogoutOpen(false);
  const confirmLogout = () => {
    closeLogout();
    logout();
    navigate('/login', { replace: true });
  };

  useEffect(() => {
    try {
      document.body.style.overflow = sidebarOpen ? 'hidden' : '';
    } catch (e) {
      // ignore
    }
    try { console.log('[Layout] sidebarOpen=', sidebarOpen); } catch (e) {}
    return () => {
      try { document.body.style.overflow = ''; } catch (e) { /* ignore */ }
    };
  }, [sidebarOpen]);

  // Global modal observer: lock body scroll when any modal/overlay (fixed inset-0) appears
  useEffect(() => {
    let lockCount = 0;
    let scrollY = 0;

    const lockBody = () => {
      if (lockCount === 0) {
        scrollY = window.scrollY || window.pageYOffset || 0;
        document.body.style.position = 'fixed';
        document.body.style.top = `-${scrollY}px`;
        document.body.style.left = '0';
        document.body.style.right = '0';
      }
      lockCount += 1;
    };

    const unlockBody = () => {
      lockCount = Math.max(0, lockCount - 1);
      if (lockCount === 0) {
        try {
          document.body.style.position = '';
          document.body.style.top = '';
          document.body.style.left = '';
          document.body.style.right = '';
          window.scrollTo(0, scrollY || 0);
        } catch (e) { /* ignore */ }
      }
    };

    const checkAndUpdate = () => {
      try {
        const overlays = document.querySelectorAll('div.fixed.inset-0, [data-modal="true"], [role="dialog"].fixed');
        if (overlays && overlays.length > 0) {
          // ensure locked
          lockBody();
        } else {
          // reset locks fully
          while (lockCount > 0) unlockBody();
        }
      } catch (e) { /* ignore */ }
    };

    const observer = new MutationObserver((mutations) => {
      // On any DOM change, re-check for modal overlays
      checkAndUpdate();
    });

    // Start observing body subtree
    try {
      observer.observe(document.body, { childList: true, subtree: true });
      // initial check
      checkAndUpdate();
    } catch (e) {
      // ignore in non-browser environments
    }

    return () => {
      try { observer.disconnect(); } catch (e) {}
      try { while (lockCount > 0) unlockBody(); } catch (e) {}
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-50/50">
      <Navbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} onLogoutRequest={openLogout} />

        {/* Mobile-only marquee placed below main navbar for guests and authenticated users */}
        {(user || location.pathname !== '/') && (
          <div className="md:hidden w-full">
            {user ? (
              /* Authenticated users: brand gradient, white text, bold, subtle shadow */
              <div
                className="w-full marquee-outer text-white"
                aria-hidden="false"
                role="status"
                style={{ background: `linear-gradient(90deg, ${COLORS.primary}, ${COLORS.secondary})` }}
              >
                <div className="marquee-track font-semibold" style={{ paddingLeft: '14px', paddingRight: '14px' }}>
                  <div className="marquee-inner" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.35)' }}>
                    <span className="mr-8">👋 Welcome Back, {user.name}</span>
                    <span className="mr-8">👋 Welcome Back, {user.name}</span>
                  </div>
                </div>
              </div>
            ) : (
              /* Guests on non-home pages: use brand gradient with dark text for readability */
              <div
                className="w-full marquee-outer"
                aria-hidden="false"
                role="status"
                style={{ background: `linear-gradient(90deg, ${COLORS.secondary}, ${COLORS.primary})` }}
              >
                <div className="marquee-track font-medium" style={{ paddingLeft: '14px', paddingRight: '14px' }}>
                  <div className="marquee-inner" style={{ color: '#fff', textShadow: '0 1px 2px rgba(0,0,0,0.35)' }}>
                    <span className="mr-8">Welcome to Bal Bodh Secondary School</span>
                    <span className="mr-8">Welcome to Bal Bodh Secondary School</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

      <div className="flex relative">
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          onLogoutRequest={openLogout}
        />

        <main className="flex-1 p-4 md:p-6 w-full lg:ml-8 lg:pt-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
      {logoutOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
            <h3 className="text-lg font-semibold mb-3">Confirm Logout</h3>
            <p className="text-sm text-slate-600 mb-6">Are you sure you want to logout?</p>
            <div className="flex justify-end gap-3">
              <button onClick={closeLogout} className="px-4 py-2 rounded bg-slate-100">Cancel</button>
              <button onClick={confirmLogout} className="px-4 py-2 rounded bg-rose-600 text-white">Logout</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

// Ensure body overflow is restored if this component is ever unmounted
export function cleanupLayoutBodyOverflow() {
  try { document.body.style.overflow = ''; } catch (e) { /* ignore */ }
}