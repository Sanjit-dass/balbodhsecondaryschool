import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../services/api';

export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    try {
      // Log token state on route changes to help diagnose mobile logout issues
      try {
        const ls = typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null;
        const ss = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('token') : null;
        const apiAuth = api?.defaults?.headers?.common?.Authorization || null;
        try { console.debug('[Auth][nav] pathname=%s tokenLocal=%s tokenSession=%s apiAuth=%s', pathname, ls ? 'yes' : 'no', ss ? 'yes' : 'no', apiAuth ? 'yes' : 'no'); } catch(e){}
      } catch(e) {}
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    } catch(e) { window.scrollTo(0,0); }
  }, [pathname]);

  return null;
}
